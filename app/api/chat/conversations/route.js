import { NextResponse } from "next/server";
import { getConversations } from "@/lib/chatModel";

export async function GET() {
  try {
    const conversations = await getConversations();
    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch conversations." },
      { status: 500 }
    );
  }
}
