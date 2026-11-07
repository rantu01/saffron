import { NextResponse } from "next/server";
import { getActiveVipConfig } from "@/lib/vipConfig";

export async function GET() {
  try {
    const config = await getActiveVipConfig();
    if (!config) {
      return NextResponse.json(
        { success: false, message: "No VIP configuration is currently published." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}