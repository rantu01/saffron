import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, newPassword } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { success: false, message: "newPassword is required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const { getAdminAuth } = await import("@/lib/firebaseAdmin");
    const adminAuth = getAdminAuth();

    await adminAuth.updateUser(uid, { password: newPassword });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    const code = error?.errorInfo?.code || error?.code || "";
    let message = error.message || "Failed to update password.";

    if (code === "auth/user-not-found") {
      message = "User not found in Firebase Authentication.";
    }

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}