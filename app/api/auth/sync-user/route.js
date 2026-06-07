import { NextResponse } from "next/server";
import { syncAuthenticatedUser } from "@/lib/userModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, email, displayName, phoneNumber, invitationCode } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { success: false, message: "uid and email are required." },
        { status: 400 }
      );
    }

    const user = await syncAuthenticatedUser({
      uid,
      email,
      displayName,
      phoneNumber,
      invitationCode,
    });

    return NextResponse.json({ success: true, message: "User synced.", user });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Sync failed." },
      { status: 500 }
    );
  }
}