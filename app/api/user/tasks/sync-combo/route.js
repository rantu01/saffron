import { NextResponse } from "next/server";
import { applyUserComboConfig } from "@/lib/comboTaskModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const result = await applyUserComboConfig(uid);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync combo config" },
      { status: 500 }
    );
  }
}
