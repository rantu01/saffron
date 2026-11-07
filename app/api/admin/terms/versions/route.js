import { NextResponse } from "next/server";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";
import { listTermsVersions, createTermsVersion } from "@/lib/termsModel";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);
    const { searchParams } = new URL(request.url);
    const result = await listTermsVersions({
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
    const { version, content, effectiveFrom, status, language } = body || {};
    if (!version || !content) {
      return NextResponse.json(
        { success: false, message: "version and content are required." },
        { status: 400 }
      );
    }
    const created = await createTermsVersion({
      version,
      content,
      effectiveFrom: effectiveFrom || null,
      createdBy: authContext.uid,
      status: status || "draft",
      language: language || "en",
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