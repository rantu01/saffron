import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getUserByUid } from "@/lib/userModel";
import { normalizeRole } from "@/lib/roles";

function getBearerToken(request) {
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export async function GET(request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication is required." },
        { status: 401 }
      );
    }

    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const user = await getUserByUid(decodedToken.uid);

    if (!user?.role) {
      return NextResponse.json(
        { success: false, message: "Your account does not have an assigned role." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      role: normalizeRole(user.role),
    });
  } catch (error) {
    console.error("Failed to resolve authenticated user role:", error);
    return NextResponse.json(
      { success: false, message: "Unable to verify your account role." },
      { status: 401 }
    );
  }
}
