import { NextResponse } from "next/server";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";
import { getTermsAcceptances } from "@/lib/termsModel";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);
    const { searchParams } = new URL(request.url);
    const result = await getTermsAcceptances({
      uid: searchParams.get("uid") || null,
      version: searchParams.get("version") || null,
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