import { NextResponse } from "next/server";
import { getVipRequests } from "@/lib/vipModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const status = searchParams.get("status") || "pending";

    const data = await getVipRequests({ search, page, limit, status });
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch VIP requests." },
      { status: 500 }
    );
  }
}
