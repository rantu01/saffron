import { NextResponse } from "next/server";
import { setUserVipLevel } from "@/lib/vipModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";
import { createActivityLog } from "@/lib/activityLog";

export async function POST(request, { params }) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { uid } = await params;
    const body = await request.json().catch(() => ({}));
    const { level, action = "set", note } = body;

    if (level == null || Number(level) < 1) {
      return NextResponse.json(
        { success: false, message: "A valid target level is required." },
        { status: 400 }
      );
    }

    const result = await setUserVipLevel(uid, Number(level), { adminUid: authContext.uid, action, note });
    try {
      await createActivityLog({
        actorUid: authContext.uid,
        actorEmail: authContext.user?.email || "",
        actorRole: authContext.user?.role || "",
        action: "vip.level.set",
        targetType: "user",
        targetId: uid,
        targetSnapshot: { uid, level },
        before: null,
        after: { level: Number(level), action, note },
        reason: note || "",
        metadata: { uid, level, action },
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
        userAgent: request.headers.get("user-agent") || "",
      });
    } catch {}
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 400;
    if (status === 500) {
      console.error("Failed to update VIP level:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
