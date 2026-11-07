import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { updateDepositStatus, getDepositById } from "@/lib/depositModel";
import { creditUserBalance, getUserByUid } from "@/lib/userModel";
import { evaluateVipEligibility } from "@/lib/vipModel";
import { roundCurrency } from "@/lib/taskModel";
import { createBalanceLog } from "@/lib/balanceLog";
import { createNotification } from "@/lib/notificationModel";
import { publishRealtime } from "@/lib/realtimeHub";
import { getWhatsAppSettings } from "@/lib/whatsappSettingsModel";
import { sendDepositApproved, sendDepositRejected } from "@/lib/whatsappService";
import { requireAdminUser, requireFirebaseAuth } from "@/lib/apiAuth";
import { createActivityLog } from "@/lib/activityLog";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const query = status ? { status } : {};

    const [deposits, total] = await Promise.all([
      db
        .collection("deposits")
        .find(query)
        .project({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      db.collection("deposits").countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      deposits,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch deposits:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function PATCH(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const { depositId, status, rejectionReason } = body;

    if (!depositId || !status) {
      return NextResponse.json(
        { success: false, message: "depositId and status required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const deposit = await getDepositById(depositId);
    if (!deposit) {
      return NextResponse.json(
        { success: false, message: "Deposit not found" },
        { status: 404 }
      );
    }

    const user = await getUserByUid(deposit.uid);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Deposit user not found" },
        { status: 404 }
      );
    }

    // Wrap the claim + balance mutation in a transaction so a partial failure
    // cannot leave the deposit approved but the balance uncredited.
    const session = client.startSession();
    let result = null;
    let updatedUser = user;
    let balanceBefore = Number(user.availableBalance || 0);
    const comboDebt = Number(user.comboDebt || 0);
    let transactionError = null;

    try {
      await session.withTransaction(async () => {
        result = await updateDepositStatus(depositId, status, authContext.uid, rejectionReason, session);
        if (!result) {
          throw new Error("ALREADY_PROCESSED");
        }

        if (status === "approved") {
          balanceBefore = Number(user.availableBalance || 0);

          if (comboDebt > 0) {
            const debtCleared = Math.min(comboDebt, deposit.amount);
            const remaining = roundCurrency(deposit.amount - debtCleared);
            const newDebt = roundCurrency(comboDebt - debtCleared);

            await db.collection("users").updateOne(
              { uid: deposit.uid },
              {
                $inc: { availableBalance: remaining, totalEarned: deposit.amount },
                $set: { comboDebt: newDebt, updatedAt: new Date() },
              },
              { session }
            );

            if (newDebt === 0) {
              const userAfter = await getUserByUid(deposit.uid, session);
              const frozenBalance = Number(userAfter?.frozenBalance || 0);
              if (frozenBalance > 0) {
                await db.collection("users").updateOne(
                  { uid: deposit.uid },
                  {
                    $inc: { availableBalance: frozenBalance },
                    $set: { frozenBalance: 0, updatedAt: new Date() },
                  },
                  { session }
                );
              }

              const waitingCombo = await db.collection("comboTasks").findOne(
                { uid: deposit.uid, status: "waiting_balance" },
                { session }
              );
              if (waitingCombo) {
                await db.collection("comboTasks").updateOne(
                  { _id: waitingCombo._id },
                  { $set: { status: "pending", updatedAt: new Date() } },
                  { session }
                );
              }
            }
          } else {
            await creditUserBalance(deposit.uid, deposit.amount, { autoResolveFreeze: true, session });

            // Combined Task fund freeze: if a pending combo has a frozen amount
            // that the new deposit satisfies (same amount or covering), release
            // the corresponding frozen balance. Claimed atomically to prevent
            // duplicate unfreeze.
            try {
              let remaining = Number(deposit.amount || 0);
              const pendingCombos = await db.collection("comboTasks").find(
                { uid: deposit.uid, balanceFrozen: true, frozenReleased: { $ne: true } },
                { session }
              ).toArray();
              for (const combo of pendingCombos) {
                const frozenAmt = Number(combo.frozenAmount || 0);
                if (frozenAmt <= 0 || frozenAmt > remaining + 0.0001) continue;
                const claimed = await db.collection("comboTasks").findOneAndUpdate(
                  { _id: combo._id, balanceFrozen: true, frozenReleased: { $ne: true } },
                  { $set: { frozenReleased: true, updatedAt: new Date() } },
                  { session, returnDocument: "after" }
                );
                if (!claimed) continue;
                await db.collection("users").updateOne(
                  { uid: deposit.uid },
                  { $inc: { availableBalance: frozenAmt, frozenBalance: -frozenAmt }, $set: { updatedAt: new Date() } },
                  { session }
                );
                remaining = roundCurrency(remaining - frozenAmt);
                await createBalanceLog({
                  uid: deposit.uid,
                  email: deposit.email || user.email,
                  type: "combo_release",
                  amount: frozenAmt,
                  balanceBefore: 0,
                  balanceAfter: 0,
                  description: `Combined task frozen balance released by deposit of $${deposit.amount}`,
                  referenceId: String(combo._id),
                  referenceType: "combo_task",
                  metadata: { depositId, frozenAmount: frozenAmt },
                  session,
                });
              }
            } catch (e) {
              // Non-fatal within transaction? Keep as best-effort.
            }
          }

          updatedUser = await getUserByUid(deposit.uid, session);

          await createBalanceLog({
            uid: deposit.uid,
            email: deposit.email || user.email,
            type: "deposit",
            amount: deposit.amount,
            balanceBefore,
            balanceAfter: Number(updatedUser?.availableBalance || 0),
            description: `Deposit approved: $${deposit.amount}${comboDebt > 0 ? ` ($${Math.min(comboDebt, deposit.amount)} applied to debt)"` : ""}`,
            referenceId: depositId,
            referenceType: "deposit",
            metadata: { approverUid: authContext.uid, comboDebtBefore: comboDebt },
            session,
          });
        }
      });
    } catch (err) {
      if (err?.message === "ALREADY_PROCESSED") {
        await session.endSession();
        return NextResponse.json(
          { success: false, message: "This deposit has already been processed." },
          { status: 409 }
        );
      }
      transactionError = err;
    } finally {
      await session.endSession().catch(() => {});
    }

    if (transactionError) {
      throw transactionError;
    }

    if (status === "approved") {
      // Raise a pending VIP upgrade request if the deposit pushed the user over
      // a tier threshold (admin approval still required).
      await evaluateVipEligibility(deposit.uid).catch(() => {});
    }

    try {
      await createNotification({
        uid: deposit.uid,
        type: status === "approved" ? "deposit_approved" : "deposit_rejected",
        title: status === "approved" ? "Deposit Approved" : "Deposit Rejected",
        message:
          status === "approved"
            ? `Your deposit of $${deposit.amount} has been approved.`
            : `Your deposit of $${deposit.amount} was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
        metadata: { depositId, amount: deposit.amount },
      }).catch(() => null);
      publishRealtime("counts-changed", { reason: `deposit_${status}` });
    } catch {}

    const wsSettings = await getWhatsAppSettings();
    if (wsSettings?.enabled && user?.phoneNumber) {
      const name = user.displayName || user.email || "User";
      if (status === "approved" && wsSettings.notifyOnDeposit !== false) {
        sendDepositApproved(user.phoneNumber, name, deposit.amount, updatedUser?.availableBalance || 0).catch(() => {});
      } else if (status === "rejected" && wsSettings.notifyOnDeposit !== false) {
        sendDepositRejected(user.phoneNumber, name, deposit.amount, rejectionReason).catch(() => {});
      }
    }

    try {
      await createActivityLog({
        actorUid: authContext.uid,
        actorEmail: authContext.user?.email || "",
        actorRole: authContext.user?.role || "",
        action: status === "approved" ? "deposit.approve" : "deposit.reject",
        targetType: "deposit",
        targetId: depositId,
        targetSnapshot: { uid: deposit?.uid, amount: deposit?.amount },
        before: { status: "pending" },
        after: { status },
        reason: rejectionReason || "",
        metadata: { depositId },
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
        userAgent: request.headers.get("user-agent") || "",
      });
    } catch {}

    return NextResponse.json({ success: true, deposit: result });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    if (status === 500) {
      console.error("Failed to update deposit:", error);
    }

    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
