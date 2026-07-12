import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getAllDeposits, updateDepositStatus, getDepositById } from "@/lib/depositModel";
import { creditUserBalance, getUserByUid } from "@/lib/userModel";
import { createBalanceLog } from "@/lib/balanceLog";
import { getWhatsAppSettings } from "@/lib/whatsappSettingsModel";
import { sendDepositApproved, sendDepositRejected } from "@/lib/whatsappService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const deposits = await getAllDeposits();
    
    const filtered = status ? deposits.filter(d => d.status === status) : deposits;

    return NextResponse.json({ success: true, deposits: filtered });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch deposits" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { depositId, status, approverUid, rejectionReason } = body;

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

    let updatedUser = user;

    if (status === "approved") {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
      const balanceBefore = Number(user.availableBalance || 0);
      const comboDebt = Number(user.comboDebt || 0);

      if (comboDebt > 0) {
        const debtCleared = Math.min(comboDebt, deposit.amount);
        const remaining = roundCurrency(deposit.amount - debtCleared);
        const newDebt = roundCurrency(comboDebt - debtCleared);

        await db.collection("users").updateOne(
          { uid: deposit.uid },
          {
            $inc: { availableBalance: remaining, totalEarned: deposit.amount },
            $set: { comboDebt: newDebt, updatedAt: new Date() },
          }
        );

        if (newDebt === 0) {
          const userAfter = await getUserByUid(deposit.uid);
          const frozenBalance = Number(userAfter?.frozenBalance || 0);
          if (frozenBalance > 0) {
            await db.collection("users").updateOne(
              { uid: deposit.uid },
              {
                $inc: { availableBalance: frozenBalance },
                $set: { frozenBalance: 0, updatedAt: new Date() },
              }
            );
          }

          const waitingCombo = await db.collection("comboTasks").findOne({
            uid: deposit.uid,
            status: "waiting_balance",
          });
          if (waitingCombo) {
            await db.collection("comboTasks").updateOne(
              { _id: waitingCombo._id },
              { $set: { status: "pending", updatedAt: new Date() } }
            );
          }
        }
      } else {
        await creditUserBalance(deposit.uid, deposit.amount, { autoResolveFreeze: true });
      }

      updatedUser = await getUserByUid(deposit.uid);

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
        metadata: { approverUid, comboDebtBefore: comboDebt },
      });
    }

    const result = await updateDepositStatus(depositId, status, approverUid, rejectionReason);

    const wsSettings = await getWhatsAppSettings();
    if (wsSettings?.enabled && user?.phoneNumber) {
      const name = user.displayName || user.email || "User";
      if (status === "approved" && wsSettings.notifyOnDeposit !== false) {
        sendDepositApproved(user.phoneNumber, name, deposit.amount, updatedUser?.availableBalance || 0).catch(() => {});
      } else if (status === "rejected" && wsSettings.notifyOnDeposit !== false) {
        sendDepositRejected(user.phoneNumber, name, deposit.amount, rejectionReason).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, deposit: result.value });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update deposit" },
      { status: 500 }
    );
  }
}
