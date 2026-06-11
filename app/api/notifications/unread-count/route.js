import { NextResponse } from "next/server";
import { getUnreadNotificationCount } from "@/lib/notificationModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

    const count = await getUnreadNotificationCount(uid);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get unread count." },
      { status: 500 }
    );
  }
}
