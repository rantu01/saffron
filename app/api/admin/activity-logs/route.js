import { NextResponse } from "next/server";
import { getActivityLogs } from "@/lib/activityLog";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const logs = await getActivityLogs({
      actorUid: searchParams.get("actorUid") || null,
      action: searchParams.get("action") || null,
      targetType: searchParams.get("targetType") || null,
      targetId: searchParams.get("targetId") || null,
      startDate: searchParams.get("startDate") || null,
      endDate: searchParams.get("endDate") || null,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    });

    return NextResponse.json({ success: true, ...logs });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) console.error("Failed to fetch activity logs:", error);
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
