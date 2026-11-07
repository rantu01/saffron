import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsappService";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ success: false, message: "phone and message required" }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(phone, message);
    return NextResponse.json({ success: result.success, ...result });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to send WhatsApp test message:", error);
    }
    return NextResponse.json({ success: false, message: status === 500 ? "Internal server error." : error.message }, { status });
  }
}
