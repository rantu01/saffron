import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { syncAuthenticatedUser } from "@/lib/userModel";
import { requireFirebaseAuth } from "@/lib/apiAuth";
import { createLoginHistory } from "@/lib/loginHistory";
import { recordTermsAcceptance, getActiveTermsVersion } from "@/lib/termsModel";

function getClientIp(request) {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "";
}

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request, { requireRole: false });
    const body = await request.json();
    const { uid, email, displayName, phoneNumber, invitationCode, username, acceptedTermsVersion } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { success: false, message: "uid and email are required." },
        { status: 400 }
      );
    }

    if (uid !== authContext.uid) {
      return NextResponse.json(
        { success: false, message: "uid must match the authenticated user." },
        { status: 403 }
      );
    }

    const tokenEmail = authContext.decodedToken?.email;
    if (tokenEmail && email !== tokenEmail) {
      return NextResponse.json(
        { success: false, message: "email must match the authenticated user." },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";

    const result = await syncAuthenticatedUser({
      uid,
      email,
      displayName,
      phoneNumber,
      invitationCode,
      username,
    });

    const { isNewUser, ...user } = result;

    // Record login history and update last-login metadata on the user doc.
    try {
      await createLoginHistory({ uid, email, ip, userAgent, result: "success" });
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
      await db.collection("users").updateOne(
        { uid },
        { $set: { lastLoginIp: ip, lastLoginUserAgent: userAgent, lastLoginAt: new Date() } }
      );
    } catch (e) {
      // Non-fatal: do not block sync on audit write failure.
    }

    // Record terms acceptance if the client provided an accepted version.
    // Server-side: only record when it matches the currently published version.
    if (acceptedTermsVersion) {
      try {
        const active = await getActiveTermsVersion();
        if (active && String(active.version).trim() === String(acceptedTermsVersion).trim()) {
          await recordTermsAcceptance({
            uid,
            version: active.version,
            ip,
            userAgent,
            source: "signup",
          });
        }
      } catch (e) {
        // Non-fatal.
      }
    }

    return NextResponse.json({
      success: true,
      message: "User synced.",
      user,
      isNewUser: Boolean(isNewUser),
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
