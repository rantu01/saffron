import { NextResponse } from "next/server";
import { getAllWithdrawals, updateWithdrawalStatus, getWithdrawalById } from "@/lib/withdrawalModel";
import { canUserWithdraw, debitUserBalance, getUserByUid, resolveFrozenBalanceState } from "@/lib/userModel";
import { createBalanceLog } from "@/lib/balanceLog";
import { getWhatsAppSettings } from "@/lib/whatsappSettingsModel";
import { sendWithdrawalApproved, sendWithdrawalRejected } from "@/lib/whatsappService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const withdrawals = await getAllWithdrawals();
    
    const filtered = status ? withdrawals.filter(w => w.status === status) : withdrawals;

    return NextResponse.json({ success: true, withdrawals: filtered });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { withdrawalId, status, approverUid, rejectionReason } = body;

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

    let updatedUser = null;

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

      const balanceBefore = Number(resolvedUser.availableBalance || 0);
      await debitUserBalance(withdrawal.uid, withdrawal.amount, { autoResolveFreeze: false });
      updatedUser = await getUserByUid(withdrawal.uid);

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
        metadata: { approverUid, walletAddress: withdrawal.walletAddress },
      });
    }

    const result = await updateWithdrawalStatus(withdrawalId, status, approverUid, rejectionReason);

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

    return NextResponse.json({ success: true, withdrawal: result.value });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update withdrawal" },
      { status: 500 }
    );
  }
}
