import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsappService";

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ success: false, message: "phone and message required" }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(phone, message);
    return NextResponse.json({ success: result.success, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
