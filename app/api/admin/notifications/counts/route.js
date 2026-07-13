import { NextResponse } from "next/server";
import { getPendingDepositCount } from "@/lib/depositModel";
import { getTotalUnreadMessageCount } from "@/lib/chatModel";
import { getPendingVipRequestCount } from "@/lib/vipModel";

export async function GET() {
  try {
    const [pendingDeposits, unreadMessages, pendingVipRequests] = await Promise.all([
      getPendingDepositCount(),
      getTotalUnreadMessageCount(),
      getPendingVipRequestCount(),
    ]);

    return NextResponse.json({
      success: true,
      pendingDeposits,
      unreadMessages,
      pendingVipRequests,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get notification counts" },
      { status: 500 }
    );
  }
}
