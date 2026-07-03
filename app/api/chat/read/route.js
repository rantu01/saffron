import { NextResponse } from "next/server";
import { markConversationAsRead } from "@/lib/chatModel";

export async function PUT(request) {
  try {
    const body = await request.json();
    const { conversationId, byUid } = body;

    if (!conversationId || !byUid) {
      return NextResponse.json(
        { success: false, message: "conversationId and byUid are required." },
        { status: 400 }
      );
    }

    await markConversationAsRead({ conversationId, byUid });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to mark as read." },
      { status: 500 }
    );
  }
}
