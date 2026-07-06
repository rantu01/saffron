import { NextResponse } from "next/server";
import { startComboOrder } from "@/lib/comboTaskModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { comboId, uid } = body;

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
    return NextResponse.json(
      { success: false, message: error.message || "Failed to start order" },
      { status: 500 }
    );
  }
}
