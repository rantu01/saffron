import { NextResponse } from "next/server";
import { syncAuthenticatedUser } from "@/lib/userModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, email, displayName, phoneNumber, invitationCode, username } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { success: false, message: "uid and email are required." },
        { status: 400 }
      );
    }

    const result = await syncAuthenticatedUser({
      uid,
      email,
      displayName,
      phoneNumber,
      invitationCode,
      username,
    });

    const { isNewUser, ...user } = result;

    return NextResponse.json({
      success: true,
      message: "User synced.",
      user,
      isNewUser: Boolean(isNewUser),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Sync failed." },
      { status: 500 }
    );
  }
}