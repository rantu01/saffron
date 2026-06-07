import { NextResponse } from "next/server";
import { getNotificationLogs } from "@/lib/whatsappSettingsModel";

export async function GET() {
  try {
    const logs = await getNotificationLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
