import { NextResponse } from "next/server";
import { getBearerToken, requireFirebaseAuth } from "@/lib/apiAuth";
import { normalizeRole } from "@/lib/roles";

export async function GET(request) {
  try {
    const context = await requireFirebaseAuth(request);

    return NextResponse.json({
      success: true,
      role: normalizeRole(context.user.role),
      uid: context.uid,
    });
  } catch (error) {
    console.error("Failed to resolve authenticated user role:", error);

    if (error instanceof Error && "status" in error && typeof error.status === "number") {
      return NextResponse.json(
        { success: false, message: error.status === 500 ? "Internal server error." : error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { success: false, message: "Unable to verify your account role." },
      { status: 401 }
    );
  }
}
