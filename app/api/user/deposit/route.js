import { NextResponse } from "next/server";
import { createDeposit, getDepositsByUid } from "@/lib/depositModel";
import { publishRealtime } from "@/lib/realtimeHub";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);

    const body = await request.json();
    const { amount, screenshot } = body;
    const uid = authContext.uid;
    const email = authContext.user?.email || body.email;

    if (!uid || !email || !amount || !screenshot) {
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

    const deposit = await createDeposit(uid, email, numAmount, screenshot);

    try {
      publishRealtime("counts-changed", { reason: "deposit_created" });
      publishRealtime("notification", { forAdmin: true, type: "deposit_created", title: "New deposit request", preview: `${email} requested $${numAmount}` });
    } catch {}

    return NextResponse.json({ success: true, deposit });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to create deposit:", error);
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

    const deposits = await getDepositsByUid(uid);

    return NextResponse.json({ success: true, deposits });
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
