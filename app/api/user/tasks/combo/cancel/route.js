import { NextResponse } from "next/server";
import { cancelComboTask } from "@/lib/comboTaskModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { comboId, uid } = body;

    if (!comboId || !uid) {
      return NextResponse.json({ success: false, message: "comboId and uid required" }, { status: 400 });
    }

    const result = await cancelComboTask(comboId, uid);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to cancel combo task" },
      { status: 500 }
    );
  }
}
