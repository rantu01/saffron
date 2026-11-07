import { NextResponse } from "next/server";
import { startComboOrder } from "@/lib/comboTaskModel";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);

    const body = await request.json();
    const { comboId } = body;
    const uid = authContext.uid;

    if (!comboId || !uid) {
      return NextResponse.json({ success: false, message: "comboId and uid required" }, { status: 400 });
    }

    const result = await startComboOrder(comboId, uid);

    if (!result.success) {
      if (result.insufficientBalance) {
        return NextResponse.json({
          success: false,
          insufficientBalance: true,
          message: "Insufficient balance to start this order",
          requiredAmount: result.requiredAmount,
          currentBalance: result.currentBalance,
          additionalRequired: result.additionalRequired,
          status: "waiting_balance",
        }, { status: 200 });
      }
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      order: result.order,
      orderIndex: result.orderIndex,
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    if (status === 500) {
      console.error("Failed to start order:", error);
    }

    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}