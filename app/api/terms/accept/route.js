import { NextResponse } from "next/server";
import { requireFirebaseAuth } from "@/lib/apiAuth";
import { recordTermsAcceptance, getActiveTermsVersion } from "@/lib/termsModel";

function getClientIp(request) {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "";
}

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const body = await request.json().catch(() => ({}));
    const { version, source } = body || {};

    let targetVersion = version;
    if (!targetVersion) {
      const active = await getActiveTermsVersion();
      targetVersion = active?.version;
    }
    if (!targetVersion) {
      return NextResponse.json(
        { success: false, message: "No terms version to accept." },
        { status: 400 }
      );
    }

    // Validate the version exists/is published when a specific version is given.
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const record = await recordTermsAcceptance({
      uid: authContext.uid,
      version: targetVersion,
      ip,
      userAgent,
      source: source || "signup",
    });

    return NextResponse.json({ success: true, acceptance: record });
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