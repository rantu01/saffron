import { NextResponse } from "next/server";
import { getOverviewReport, getFinancialReport, getUserActivityReport, getAdSpendReport } from "@/lib/reportService";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const period = searchParams.get("period") || "daily";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let data;
    switch (type) {
      case "overview":
        data = await getOverviewReport();
        break;
      case "financial":
        data = await getFinancialReport(period, startDate, endDate);
        break;
      case "users":
        data = await getUserActivityReport(startDate, endDate);
        break;
      case "ad-spend":
        data = await getAdSpendReport(startDate, endDate);
        break;
      default:
        return NextResponse.json({ success: false, message: "Invalid report type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch report:", error);
    }
    return NextResponse.json({ success: false, message: status === 500 ? "Internal server error." : error.message }, { status });
  }
}
