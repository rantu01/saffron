import { NextResponse } from "next/server";
import { createWithdrawal, getWithdrawalsByUid } from "@/lib/withdrawalModel";
import clientPromise from "@/lib/mongodb";
import { canUserWithdraw, getUserByUid, resolveFrozenBalanceState } from "@/lib/userModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, email, walletAddress, amount } = body;

    if (!uid || !email || !walletAddress || !amount) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (numAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    await clientPromise;
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

    if (Number(resolvedUser.availableBalance || 0) < numAmount) {
      return NextResponse.json(
        { success: false, message: "Insufficient balance" },
        { status: 400 }
      );
    }

    const withdrawal = await createWithdrawal(uid, email, walletAddress, numAmount);

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create withdrawal" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "UID required" },
        { status: 400 }
      );
    }

    const withdrawals = await getWithdrawalsByUid(uid);

    return NextResponse.json({ success: true, withdrawals });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}
