import { NextResponse } from "next/server";
import { requireFirebaseAuth } from "@/lib/apiAuth";
import { hasAcceptedTerms, getActiveTermsVersion } from "@/lib/termsModel";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");
    const target = version || (await getActiveTermsVersion())?.version;
    if (!target) {
      return NextResponse.json({ success: true, accepted: false, version: null });
    }
    const accepted = await hasAcceptedTerms(authContext.uid, target);
    return NextResponse.json({ success: true, accepted, version: target });
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