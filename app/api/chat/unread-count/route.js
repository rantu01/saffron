import { NextResponse } from "next/server";
import { getUnreadCountForUser } from "@/lib/chatModel";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const uid = authContext.uid;

    const unreadCount = await getUnreadCountForUser({ conversationId: uid, uid });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
