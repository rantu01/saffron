import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const uid = authContext.uid;

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const user = await db.collection("users").findOne({ uid });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const invitations = await db.collection("invitationCodes")
      .find({ createdByUid: uid })
      .sort({ createdAt: -1 })
      .toArray();

    const referredUsers = await db.collection("users")
      .find({ inviterUid: uid })
      .sort({ createdAt: -1 })
      .toArray();

    const totalReferralEarnings = referredUsers.reduce(
      (sum, u) => sum + Number(u.totalDemoProfitShared || 0), 0
    );

    const ownCode = user.referralCode || "";
    const referralUrl = ownCode
      ? `${request.nextUrl.origin}/login?ref=${ownCode}`
      : `${request.nextUrl.origin}/login?ref=${uid}`;

    return NextResponse.json({
      success: true,
      referral: {
        referralUrl,
        referralCode: ownCode,
        totalReferrals: referredUsers.length,
        totalReferralEarnings,
        invitations: invitations.map((inv) => ({
          _id: inv._id,
          code: inv.code,
          isActive: inv.isActive,
          usedByEmail: inv.usedByEmail || null,
          usedAt: inv.usedAt || null,
          createdAt: inv.createdAt,
        })),
        referredUsers: referredUsers.map((u) => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || "",
          accountType: u.accountType || (u.isDemoAccount ? "demo" : "main"),
          totalEarned: Number(u.totalEarned || 0),
          totalDemoProfitShared: Number(u.totalDemoProfitShared || 0),
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to load referral data:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
