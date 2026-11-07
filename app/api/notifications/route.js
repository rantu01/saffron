import { NextResponse } from "next/server";
import { createNotification, getNotifications } from "@/lib/notificationModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const { searchParams } = new URL(request.url);
    const uid = authContext.uid;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await getNotifications({ uid, page, limit });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch notifications:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

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
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to create notification:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}