import { NextResponse } from "next/server";
import { getPendingDepositCount } from "@/lib/depositModel";
import { getTotalUnreadMessageCount } from "@/lib/chatModel";
import { getPendingVipRequestCount } from "@/lib/vipModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

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
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to get notification counts:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
