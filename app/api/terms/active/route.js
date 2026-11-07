import { NextResponse } from "next/server";
import { getActiveTermsVersion } from "@/lib/termsModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "en";
    const version = await getActiveTermsVersion(lang);
    if (!version) {
      return NextResponse.json(
        { success: false, message: "No terms version is currently published." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, version });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}