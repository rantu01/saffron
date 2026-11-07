import { NextResponse } from "next/server";
import { getComboConfig, updateComboConfig } from "@/lib/comboTaskModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";
import { createActivityLog } from "@/lib/activityLog";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const config = await getComboConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to load combo config:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const config = await updateComboConfig(body);
    try {
      await createActivityLog({
        actorUid: authContext.uid,
        actorEmail: authContext.user?.email || "",
        actorRole: authContext.user?.role || "",
        action: "combo.config.update",
        targetType: "comboConfig",
        targetId: "global",
        targetSnapshot: config || null,
        before: null,
        after: body || null,
        reason: "",
        metadata: {},
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
        userAgent: request.headers.get("user-agent") || "",
      });
    } catch {}
    return NextResponse.json({
      success: true,
      message: "Combo task configuration updated",
      config,
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to update combo config:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}