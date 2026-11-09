import { NextResponse } from "next/server";
import { sendMessage, getMessages, getNewMessages } from "@/lib/chatModel";
import { createNotification } from "@/lib/notificationModel";
import { publishRealtime } from "@/lib/realtimeHub";
import clientPromise from "@/lib/mongodb";
import { requireFirebaseAuth, ApiError } from "@/lib/apiAuth";
import { normalizeRole } from "@/lib/roles";

async function getAdminUids() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
    const admins = await db
      .collection("users")
      .find({ role: "admin" }, { projection: { uid: 1 } })
      .limit(50)
      .toArray();
    return admins.map((a) => a.uid).filter(Boolean);
  } catch {
    return [];
  }
}

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const isAdmin = normalizeRole(authContext.user?.role) === "admin";

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const afterId = searchParams.get("afterId");
    const before = searchParams.get("before");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: "conversationId is required." },
        { status: 400 }
      );
    }

    if (!isAdmin && conversationId !== authContext.uid) {
      throw new ApiError(403, "You can only read your own conversation.");
    }

    let messages;
    if (afterId) {
      messages = await getNewMessages({ conversationId, afterId });
    } else {
      messages = await getMessages({ conversationId, limit, before: before || undefined });
    }

    return NextResponse.json({ success: true, messages });
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

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const isAdmin = normalizeRole(authContext.user?.role) === "admin";

    const body = await request.json();
    const { senderName, message, imageUrl } = body;
    let conversationId = body.conversationId;

    if (!isAdmin) {
      conversationId = authContext.uid;
    }

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: "conversationId is required." },
        { status: 400 }
      );
    }

    const senderUid = authContext.uid;
    const senderRole = isAdmin ? "admin" : "user";

    if (!imageUrl && !message?.trim()) {
      return NextResponse.json(
        { success: false, message: "Either a message or an image is required." },
        { status: 400 }
      );
    }

    const msg = await sendMessage({ conversationId, senderUid, senderRole, senderName, message, imageUrl });

    // Realtime fan-out (never break the request if realtime fails)
    try {
      const preview = (message || "").trim().slice(0, 120) || (imageUrl ? "[Image]" : "New message");
      if (senderRole === "admin") {
        // Admin -> user: create a notification for the user (conversationId === user uid)
        try {
          await createNotification({
            uid: conversationId,
            type: "chat_reply",
            title: "New reply from Customer Service",
            message: preview,
            metadata: { conversationId, messageId: msg._id, senderUid },
          });
        } catch {}
        publishRealtime("chat-message", {
          conversationId,
          messageId: msg._id,
          senderRole,
          senderUid,
          senderName,
          preview,
          createdAt: msg.createdAt,
        });
        // Note: createNotification() above already published the matching
        // "notification" SSE event — no duplicate publish here.
      } else {
        // User -> admins: notify every admin so sidebar badges + sound fire instantly
        const adminUids = await getAdminUids();
        await Promise.all(
          adminUids.map((adminUid) =>
            createNotification({
              uid: adminUid,
              type: "chat_message",
              title: `New message from ${senderName || "user"}`,
              message: preview,
              metadata: { conversationId, messageId: msg._id, senderUid },
            }).catch(() => null)
          )
        );
        publishRealtime("chat-message", {
          conversationId,
          messageId: msg._id,
          senderRole,
          senderUid,
          senderName,
          preview,
          createdAt: msg.createdAt,
        });
        publishRealtime("notification", {
          forAdmin: true,
          type: "chat_message",
          title: `New message from ${senderName || "user"}`,
          preview,
          conversationId,
        });
      }
    } catch {}

    return NextResponse.json({ success: true, message: msg }, { status: 201 });
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
