import { NextResponse } from "next/server";
import { markConversationAsRead } from "@/lib/chatModel";
import { requireFirebaseAuth, ApiError } from "@/lib/apiAuth";
import { normalizeRole } from "@/lib/roles";

export async function PUT(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const isAdmin = normalizeRole(authContext.user?.role) === "admin";

    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: "conversationId is required." },
        { status: 400 }
      );
    }

    if (!isAdmin && conversationId !== authContext.uid) {
      throw new ApiError(403, "You can only mark your own conversation as read.");
    }

    const byUid = authContext.uid;

    await markConversationAsRead({ conversationId, byUid });
    return NextResponse.json({ success: true });
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
