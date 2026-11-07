import { NextResponse } from "next/server";
import { subscribeRealtime, formatSSE } from "@/lib/realtimeHub";
import { getBearerToken } from "@/lib/apiAuth";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getUserByUid } from "@/lib/userModel";
import { normalizeRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 3000;

async function getAdminCounts() {
  const [{ getPendingDepositCount }, { getTotalUnreadMessageCount }, { getPendingVipRequestCount }] =
    await Promise.all([import("@/lib/depositModel"), import("@/lib/chatModel"), import("@/lib/vipModel")]);
  const [pendingDeposits, unreadMessages, pendingVipRequests] = await Promise.all([
    getPendingDepositCount().catch(() => 0),
    getTotalUnreadMessageCount().catch(() => 0),
    getPendingVipRequestCount().catch(() => 0),
  ]);
  return { pendingDeposits, unreadMessages, pendingVipRequests };
}

async function getUserCounts(uid) {
  const [{ getUnreadCountForUser }, { getUnreadNotificationCount }] = await Promise.all([
    import("@/lib/chatModel"),
    import("@/lib/notificationModel"),
  ]);
  const [unreadChat, unreadNotifications] = await Promise.all([
    getUnreadCountForUser({ conversationId: uid, uid }).catch(() => 0),
    getUnreadNotificationCount(uid).catch(() => 0),
  ]);
  return { unreadChat, unreadNotifications };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // SSE clients (EventSource) cannot set headers, so accept the Firebase ID
  // token either via the Authorization header or the `token` query param.
  let role;
  let uid;
  try {
    const token = getBearerToken(request) || searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication is required." },
        { status: 401 }
      );
    }
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    uid = decodedToken?.uid;
    const user = uid ? await getUserByUid(uid) : null;
    if (!user?.role) {
      return NextResponse.json(
        { success: false, message: "Your account does not have an assigned role." },
        { status: 403 }
      );
    }
    role = normalizeRole(user.role);
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : (error?.code === "auth/id-token-expired" ? 401 : 500);
    if (status === 500) {
      console.error("Failed to authenticate realtime stream:", error);
    }
    return NextResponse.json(
      { success: false, message: error?.message || "Authentication failed." },
      { status }
    );
  }

  const encoder = new TextEncoder();
  let closed = false;
  let interval = null;
  let unsubscribe = null;
  let lastPayloadJson = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(formatSSE({ event, data })));
        } catch {
          closed = true;
        }
      };

      // Initial hello so clients know the stream is live
      send("connected", { ok: true, role, at: Date.now() });

      const pushCounts = async (forceEvent = "counts") => {
        if (closed) return;
        try {
          const data =
            role === "admin" ? await getAdminCounts() : uid ? await getUserCounts(uid) : {};
          const json = JSON.stringify(data);
          // Always send on force (instant push); otherwise only on change to reduce noise
          if (forceEvent !== "poll" || json !== lastPayloadJson) {
            lastPayloadJson = json;
            send("counts", data);
          }
        } catch {
          // silent — next tick will retry
        }
      };

      // Immediate first payload
      await pushCounts("counts");

      // Forward instant realtime events (chat-message, notification) to this client.
      // Recipient rules (server-authoritative):
      // - chat-message goes ONLY to the other party, never back to the sender.
      //   conversationId is the customer's uid; senderUid identifies the author.
      // - notification goes ONLY to the uid it was created for (or admins via forAdmin).
      unsubscribe = subscribeRealtime((evt) => {
        if (closed) return;
        const { type, payload } = evt;
        if (type === "chat-message") {
          const isOwnMessage = uid && payload?.senderUid && payload.senderUid === uid;
          if (isOwnMessage) {
            // Sender's own message: refresh counts only, never notify.
            pushCounts("counts");
            return;
          }
          if (role === "admin") {
            // Admins see all user->admin messages instantly; skip admin echoes
            if (payload?.senderRole !== "admin") send("chat-message", payload);
          } else if (uid && payload?.conversationId === uid) {
            send("chat-message", payload);
          }
          // Refresh counts immediately after any chat message
          pushCounts("counts");
        } else if (type === "notification") {
          if (role === "admin" && payload?.forAdmin) send("notification", payload);
          else if (uid && payload?.uid === uid) send("notification", payload);
          pushCounts("counts");
        } else if (type === "counts-changed") {
          pushCounts("counts");
        }
      });

      // Fallback polling so counts stay fresh even if publish is missed
      // (e.g. server restart, direct DB write paths).
      interval = setInterval(() => {
        pushCounts("poll");
        // heartbeat comment to keep proxies from closing idle connections
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
          } catch {
            closed = true;
          }
        }
      }, POLL_MS);

      request.signal?.addEventListener("abort", () => {
        closed = true;
        if (interval) clearInterval(interval);
        if (unsubscribe) unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}