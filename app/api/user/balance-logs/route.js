import { NextResponse } from "next/server";
import { getBalanceLogs } from "@/lib/balanceLog";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const { searchParams } = new URL(request.url);
    const requestedUid = searchParams.get("uid");
    const isAdmin = authContext.user?.role === "admin" || authContext.user?.role === "Admin";
    const uid = isAdmin && requestedUid ? requestedUid : authContext.uid;
    const type = searchParams.get("type") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await getBalanceLogs({ uid, type, startDate, endDate, page, limit });

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