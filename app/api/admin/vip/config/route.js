import { NextResponse } from "next/server";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";
import { listVipConfigVersions, createVipConfigVersion } from "@/lib/vipConfig";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);
    const { searchParams } = new URL(request.url);
    const result = await listVipConfigVersions({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    });
    return NextResponse.json({ success: true, ...result });
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
    requireAdminUser(authContext.user);
    const body = await request.json();
    const { levels, effectiveFrom, note } = body || {};
    if (!Array.isArray(levels) || levels.length === 0) {
      return NextResponse.json(
        { success: false, message: "levels array is required." },
        { status: 400 }
      );
    }
    const created = await createVipConfigVersion({
      levels,
      effectiveFrom: effectiveFrom || null,
      createdBy: authContext.uid,
      note: note || "",
    });
    return NextResponse.json({ success: true, version: created });
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