import { NextResponse } from "next/server";
import { getPendingDepositCount } from "@/lib/depositModel";
import { getTotalUnreadMessageCount } from "@/lib/chatModel";

export async function GET() {
  try {
    const [pendingDeposits, unreadMessages] = await Promise.all([
      getPendingDepositCount(),
      getTotalUnreadMessageCount(),
    ]);

    return NextResponse.json({
      success: true,
      pendingDeposits,
      unreadMessages,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get notification counts" },
      { status: 500 }
    );
  }
}
