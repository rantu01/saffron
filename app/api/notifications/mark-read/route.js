import { NextResponse } from "next/server";
import { markNotificationsAsRead, markAllNotificationsAsRead } from "@/lib/notificationModel";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function PATCH(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const uid = authContext.uid;

    const body = await request.json();
    const { ids, all } = body || {};

    if (all) {
      await markAllNotificationsAsRead(uid);
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "ids array is required when all is false." },
        { status: 400 }
      );
    }

    await markNotificationsAsRead(ids, uid);
    return NextResponse.json({ success: true, message: "Notifications marked as read." });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to mark notifications as read:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}