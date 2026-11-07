import { NextResponse } from "next/server";
import { getNotificationLogs } from "@/lib/whatsappSettingsModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const result = await getNotificationLogs(searchParams.get("limit") || "100", searchParams.get("page") || "1");
    return NextResponse.json({ success: true, logs: result.logs, total: result.total, page: result.page, limit: result.limit });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch WhatsApp logs:", error);
    }
    return NextResponse.json({ success: false, message: status === 500 ? "Internal server error." : error.message }, { status });
  }
}
