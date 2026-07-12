import { NextResponse } from "next/server";
import { getUnreadCountForUser } from "@/lib/chatModel";

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

    const unreadCount = await getUnreadCountForUser({ conversationId: uid, uid });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch unread count." },
      { status: 500 }
    );
  }
}
