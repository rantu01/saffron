import { NextResponse } from "next/server";
import { createWithdrawal, getWithdrawalsByUid } from "@/lib/withdrawalModel";
import { publishRealtime } from "@/lib/realtimeHub";
import clientPromise from "@/lib/mongodb";
import { canUserWithdraw, getUserByUid, resolveFrozenBalanceState } from "@/lib/userModel";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);

    const body = await request.json();
    const { walletAddress, network, amount } = body;
    const uid = authContext.uid;
    const email = authContext.user?.email || body.email;

    if (!uid || !email || !walletAddress || !amount) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be a valid number greater than 0" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const user = await getUserByUid(uid);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const resolvedUser = await resolveFrozenBalanceState(uid) || user;

    if (!canUserWithdraw(resolvedUser)) {
      return NextResponse.json(
        { success: false, message: "Demo or frozen accounts cannot withdraw until converted or unfrozen." },
        { status: 403 }
      );
    }

    if (Number(resolvedUser.comboDebt || 0) > 0) {
      return NextResponse.json(
        { success: false, message: "Cannot withdraw while you have outstanding debt. Please deposit to clear your debt first." },
        { status: 400 }
      );
    }

    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
    const incompleteSet = await db.collection("userTaskSets").findOne({
      uid,
      $expr: { $lt: ["$completedTasks", "$totalTasks"] },
    });

    if (incompleteSet) {
      return NextResponse.json(
        { success: false, message: "Cannot withdraw while you have an active task set. Please complete all tasks in the current set first." },
        { status: 400 }
      );
    }

    if (Number(resolvedUser.availableBalance || 0) < numAmount) {
      return NextResponse.json(
        { success: false, message: "Insufficient balance" },
        { status: 400 }
      );
    }

    const withdrawal = await createWithdrawal(uid, email, walletAddress, numAmount, network);

    try {
      publishRealtime("counts-changed", { reason: "withdrawal_created" });
      publishRealtime("notification", { forAdmin: true, type: "withdrawal_created", title: "New withdrawal request", preview: `${email} requested $${numAmount}` });
    } catch {}

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to create withdrawal:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const uid = authContext.uid;

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "UID required" },
        { status: 400 }
      );
    }

    const withdrawals = await getWithdrawalsByUid(uid);

    return NextResponse.json({ success: true, withdrawals });
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
