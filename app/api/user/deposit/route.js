import { NextResponse } from "next/server";
import { createDeposit, getDepositsByUid } from "@/lib/depositModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, email, amount, screenshot } = body;

    if (!uid || !email || !amount || !screenshot) {
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

    const deposit = await createDeposit(uid, email, numAmount, screenshot);

    return NextResponse.json({ success: true, deposit });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create deposit" },
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

    const deposits = await getDepositsByUid(uid);

    return NextResponse.json({ success: true, deposits });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch deposits" },
      { status: 500 }
    );
  }
}
