import { NextResponse } from "next/server";
import { setUserVipLevel } from "@/lib/vipModel";

export async function POST(request, { params }) {
  try {
    const { uid } = await params;
    const body = await request.json().catch(() => ({}));
    const { level, action = "set", adminUid, note } = body;

    if (level == null || Number(level) < 1) {
      return NextResponse.json(
        { success: false, message: "A valid target level is required." },
        { status: 400 }
      );
    }

    const result = await setUserVipLevel(uid, Number(level), { adminUid, action, note });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update VIP level." },
      { status: 400 }
    );
  }
}
