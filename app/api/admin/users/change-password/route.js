import { NextResponse } from "next/server";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

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
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    const code = error?.errorInfo?.code || error?.code || "";
    let message = status === 500 ? "Internal server error." : error.message;

    if (code === "auth/user-not-found") {
      message = "User not found in Firebase Authentication.";
    }

    if (status === 500) {
      console.error("Failed to update password:", error);
    }

    return NextResponse.json(
      { success: false, message },
      { status: status === 500 ? 500 : status }
    );
  }
}