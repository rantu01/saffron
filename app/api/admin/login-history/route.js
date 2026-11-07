import { NextResponse } from "next/server";
import { getLoginHistory } from "@/lib/loginHistory";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const entries = await getLoginHistory({
      uid: searchParams.get("uid") || null,
      result: searchParams.get("result") || null,
      startDate: searchParams.get("startDate") || null,
      endDate: searchParams.get("endDate") || null,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    });

    return NextResponse.json({ success: true, ...entries });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) console.error("Failed to fetch login history:", error);
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
