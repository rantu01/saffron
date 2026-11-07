import { NextResponse } from "next/server";
import { approveVipRequest, rejectVipRequest } from "@/lib/vipModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";
import { createActivityLog } from "@/lib/activityLog";

export async function POST(request, { params }) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, note } = body;

    let result;
    if (action === "approve") {
      result = await approveVipRequest(id, { adminUid: authContext.uid, note });
    } else if (action === "reject") {
      result = await rejectVipRequest(id, { adminUid: authContext.uid, note });
    } else {
      return NextResponse.json(
        { success: false, message: "action must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    try {
      await createActivityLog({
        actorUid: authContext.uid,
        actorEmail: authContext.user?.email || "",
        actorRole: authContext.user?.role || "",
        action: action === "approve" ? "vip.request.approve" : "vip.request.reject",
        targetType: "vipRequest",
        targetId: id,
        targetSnapshot: result || null,
        before: { status: "pending" },
        after: { status: action === "approve" ? "approved" : "rejected" },
        reason: note || "",
        metadata: { id },
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
        userAgent: request.headers.get("user-agent") || "",
      });
    } catch {}

    return NextResponse.json({ success: true, request: result });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 400;
    if (status === 500) {
      console.error("Failed to resolve VIP request:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
