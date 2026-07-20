import { NextResponse } from "next/server";
import { sendMessage, getMessages, getNewMessages } from "@/lib/chatModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const afterId = searchParams.get("afterId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: "conversationId is required." },
        { status: 400 }
      );
    }

    let messages;
    if (afterId) {
      messages = await getNewMessages({ conversationId, afterId });
    } else {
      messages = await getMessages({ conversationId, limit });
    }

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch messages." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { conversationId, senderUid, senderRole, senderName, message, imageUrl } = body;

    if (!conversationId || !senderUid || !senderRole) {
      return NextResponse.json(
        { success: false, message: "conversationId, senderUid, and senderRole are required." },
        { status: 400 }
      );
    }

    if (!imageUrl && !message?.trim()) {
      return NextResponse.json(
        { success: false, message: "Either a message or an image is required." },
        { status: 400 }
      );
    }

    const msg = await sendMessage({ conversationId, senderUid, senderRole, senderName, message, imageUrl });
    return NextResponse.json({ success: true, message: msg }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send message." },
      { status: 500 }
    );
  }
}
