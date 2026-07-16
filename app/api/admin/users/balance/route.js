import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getUserByUid, creditUserBalance, debitUserBalance } from "@/lib/userModel";
import { createBalanceLog } from "@/lib/balanceLog";
import { getWhatsAppSettings } from "@/lib/whatsappSettingsModel";
import { sendWhatsAppMessage } from "@/lib/whatsappService";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, action, amount, description, approverUid, approverEmail } = body;

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid is required." }, { status: 400 });
    }

    if (action !== "add" && action !== "deduct") {
      return NextResponse.json({ success: false, message: "action must be 'add' or 'deduct'." }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, message: "Amount must be greater than 0." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const user = await getUserByUid(uid);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const balanceBefore = Number(user.availableBalance || 0);

    if (action === "deduct" && balanceBefore < numericAmount) {
      return NextResponse.json({ success: false, message: "Cannot deduct more than the available balance." }, { status: 400 });
    }

    let updatedUser;
    if (action === "add") {
      updatedUser = await creditUserBalance(uid, numericAmount, { autoResolveFreeze: true });
    } else {
      updatedUser = await debitUserBalance(uid, numericAmount, { autoResolveFreeze: true });
    }

    const balanceAfter = Number(updatedUser?.availableBalance || balanceBefore - (action === "deduct" ? numericAmount : -numericAmount));

    const actionLabel = action === "add" ? "added" : "deducted";
    const logDescription =
      description?.trim() ||
      `Balance ${actionLabel} by admin${approverEmail ? ` (${approverEmail})` : ""}: $${numericAmount}`;

    await createBalanceLog({
      uid,
      email: user.email || "",
      type: "balance_push",
      amount: action === "add" ? numericAmount : -numericAmount,
      balanceBefore,
      balanceAfter,
      description: logDescription,
      referenceId: approverUid || null,
      referenceType: "balance_push",
      metadata: { action, approverUid, approverEmail },
    });

    const wsSettings = await getWhatsAppSettings();
    if (wsSettings?.enabled && user?.phoneNumber && wsSettings.notifyOnBalancePush !== false) {
      const name = user.displayName || user.email || "User";
      const verb = action === "add" ? "credited" : "debited";
      sendWhatsAppMessage(
        user.phoneNumber,
        `Hello ${name}, $${numericAmount} has been ${verb} to your account by admin. New balance: $${balanceAfter}`
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      balanceBefore,
      balanceAfter,
      message: `Balance ${actionLabel} successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update balance." },
      { status: 500 }
    );
  }
}
