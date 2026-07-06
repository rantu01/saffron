import { NextResponse } from "next/server";
import { getComboConfig, updateComboConfig } from "@/lib/comboTaskModel";

export async function GET() {
  try {
    const config = await getComboConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load combo config" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const config = await updateComboConfig(body);
    return NextResponse.json({
      success: true,
      message: "Combo task configuration updated",
      config,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update combo config" },
      { status: 500 }
    );
  }
}
