import { NextResponse } from "next/server";
import { markNotificationsAsRead, markAllNotificationsAsRead } from "@/lib/notificationModel";

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { uid, ids, all } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

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
    return NextResponse.json(
      { success: false, message: error.message || "Failed to mark notifications as read." },
      { status: 500 }
    );
  }
}
