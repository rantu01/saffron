import { NextResponse } from "next/server";
import { getUnreadNotificationCount } from "@/lib/notificationModel";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const uid = authContext.uid;

    const count = await getUnreadNotificationCount(uid);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to get unread count:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}