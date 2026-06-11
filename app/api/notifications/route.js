import { NextResponse } from "next/server";
import { createNotification, getNotifications } from "@/lib/notificationModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

    const result = await getNotifications({ uid, page, limit });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, type, title, message, metadata } = body;

    if (!uid || !type || !title || !message) {
      return NextResponse.json(
        { success: false, message: "uid, type, title, and message are required." },
        { status: 400 }
      );
    }

    const notification = await createNotification({ uid, type, title, message, metadata });
    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create notification." },
      { status: 500 }
    );
  }
}
