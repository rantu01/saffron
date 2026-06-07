import { NextResponse } from "next/server";
import { getBalanceLogs } from "@/lib/balanceLog";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const type = searchParams.get("type") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    if (uid === "all") {
      const result = await getBalanceLogs({ uid: null, type, startDate, endDate, page, limit });
      return NextResponse.json({ success: true, ...result });
    }

    const result = await getBalanceLogs({ uid, type, startDate, endDate, page, limit });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch balance logs" },
      { status: 500 }
    );
  }
}
