import { NextResponse } from "next/server";
import { getWithdrawalsPage, updateWithdrawalStatus, getWithdrawalById, reopenWithdrawalStatus } from "@/lib/withdrawalModel";
import { canUserWithdraw, debitUserBalance, getUserByUid, resolveFrozenBalanceState } from "@/lib/userModel";
import { createBalanceLog } from "@/lib/balanceLog";
import { createNotification } from "@/lib/notificationModel";
import { publishRealtime } from "@/lib/realtimeHub";
import { getWhatsAppSettings } from "@/lib/whatsappSettingsModel";
import { sendWithdrawalApproved, sendWithdrawalRejected } from "@/lib/whatsappService";
import { requireAdminUser, requireFirebaseAuth } from "@/lib/apiAuth";
import { createActivityLog } from "@/lib/activityLog";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "50";

    const result = await getWithdrawalsPage({ status, page, limit });

    return NextResponse.json({ success: true, withdrawals: result.withdrawals, total: result.total, page: result.page, limit: result.limit });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch withdrawals:", error);
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
    const { withdrawalId, status, rejectionReason } = body;

    if (!withdrawalId || !status) {
      return NextResponse.json(
        { success: false, message: "withdrawalId and status required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const withdrawal = await getWithdrawalById(withdrawalId);
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: "Withdrawal not found" },
        { status: 404 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    let updatedUser = null;
    let result;
    let transactionError = null;

    if (status === "approved") {
      const user = await getUserByUid(withdrawal.uid);
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Withdrawal user not found" },
          { status: 404 }
        );
      }

      const resolvedUser = await resolveFrozenBalanceState(withdrawal.uid) || user;

      if (!canUserWithdraw(resolvedUser)) {
        return NextResponse.json(
          { success: false, message: "Demo or frozen accounts cannot withdraw." },
          { status: 403 }
        );
      }

      if (Number(resolvedUser.availableBalance || 0) < withdrawal.amount) {
        return NextResponse.json(
          { success: false, message: "Insufficient user balance" },
          { status: 400 }
        );
      }

      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          result = await updateWithdrawalStatus(withdrawalId, status, authContext.uid, rejectionReason, session);
          if (!result) {
            throw new Error("ALREADY_PROCESSED");
          }

          const balanceBefore = Number(resolvedUser.availableBalance || 0);
          const debitedUser = await debitUserBalance(withdrawal.uid, withdrawal.amount, {
            autoResolveFreeze: false,
            requireSufficientBalance: true,
            session,
          });

          if (!debitedUser) {
            throw new Error("INSUFFICIENT_BALANCE");
          }

          updatedUser = await getUserByUid(withdrawal.uid, session);

          await createBalanceLog({
            uid: withdrawal.uid,
            email: withdrawal.email || user.email,
            type: "withdrawal",
            amount: -Math.abs(withdrawal.amount),
            balanceBefore,
            balanceAfter: Number(updatedUser?.availableBalance || 0),
            description: `Withdrawal approved: $${withdrawal.amount}`,
            referenceId: withdrawalId,
            referenceType: "withdrawal",
            metadata: { approverUid: authContext.uid, walletAddress: withdrawal.walletAddress },
            session,
          });
        });
      } catch (err) {
        if (err?.message === "ALREADY_PROCESSED") {
          await session.endSession().catch(() => {});
          return NextResponse.json(
            { success: false, message: "This withdrawal has already been processed." },
            { status: 409 }
          );
        }
        if (err?.message === "INSUFFICIENT_BALANCE") {
          await session.endSession().catch(() => {});
          return NextResponse.json(
            { success: false, message: "Insufficient user balance" },
            { status: 400 }
          );
        }
        transactionError = err;
      } finally {
        await session.endSession().catch(() => {});
      }

      if (transactionError) {
        throw transactionError;
      }
    } else {
      result = await updateWithdrawalStatus(withdrawalId, status, authContext.uid, rejectionReason);
      if (!result) {
        return NextResponse.json(
          { success: false, message: "This withdrawal has already been processed." },
          { status: 409 }
        );
      }
    }

    try {
      await createNotification({
        uid: withdrawal.uid,
        type: status === "approved" ? "withdrawal_approved" : "withdrawal_rejected",
        title: status === "approved" ? "Withdrawal Approved" : "Withdrawal Rejected",
        message:
          status === "approved"
            ? `Your withdrawal of $${withdrawal.amount} has been approved.`
            : `Your withdrawal of $${withdrawal.amount} was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
        metadata: { withdrawalId, amount: withdrawal.amount },
      }).catch(() => null);
      publishRealtime("counts-changed", { reason: `withdrawal_${status}` });
    } catch {}

    const wsSettings = await getWhatsAppSettings();
    if (wsSettings?.enabled) {
      const user = await getUserByUid(withdrawal.uid);
      if (user?.phoneNumber) {
        const name = user.displayName || user.email || "User";
        if (status === "approved" && wsSettings.notifyOnWithdrawal !== false) {
          sendWithdrawalApproved(user.phoneNumber, name, withdrawal.amount, withdrawal.walletAddress).catch(() => {});
        } else if (status === "rejected" && wsSettings.notifyOnWithdrawal !== false) {
          sendWithdrawalRejected(user.phoneNumber, name, withdrawal.amount, rejectionReason).catch(() => {});
        }
      }
    }

    try {
      await createActivityLog({
        actorUid: authContext.uid,
        actorEmail: authContext.user?.email || "",
        actorRole: authContext.user?.role || "",
        action: status === "approved" ? "withdrawal.approve" : "withdrawal.reject",
        targetType: "withdrawal",
        targetId: withdrawalId,
        targetSnapshot: { uid: withdrawal?.uid, amount: withdrawal?.amount },
        before: { status: "pending" },
        after: { status },
        reason: rejectionReason || "",
        metadata: { withdrawalId },
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
        userAgent: request.headers.get("user-agent") || "",
      });
    } catch {}

    return NextResponse.json({ success: true, withdrawal: result });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    if (status === 500) {
      console.error("Failed to update withdrawal:", error);
    }

    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
