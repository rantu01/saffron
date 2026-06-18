import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, email, displayName } = body;

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const existingInvite = await db.collection("invitationCodes").findOne({
      createdByUid: uid,
      isActive: true,
      usedByUid: null,
    });

    if (existingInvite) {
      await db.collection("users").updateOne(
        { uid },
        { $set: { referralCode: existingInvite.code, updatedAt: new Date() } }
      );
      return NextResponse.json({
        success: true,
        invitation: existingInvite,
        message: "You already have an active referral code",
      });
    }

    let code = generateCode();
    let retries = 0;
    while (await db.collection("invitationCodes").findOne({ code })) {
      code = generateCode();
      retries++;
      if (retries > 10) {
        return NextResponse.json({ success: false, message: "Failed to generate unique code" }, { status: 500 });
      }
    }

    const now = new Date();
    const invitation = {
      code,
      isActive: true,
      createdByUid: uid,
      createdByEmail: email || "",
      createdByName: displayName || "",
      usedByUid: null,
      usedByEmail: null,
      usedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("invitationCodes").insertOne(invitation);

    await db.collection("users").updateOne(
      { uid },
      { $set: { referralCode: code, updatedAt: now } }
    );

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate code" },
      { status: 500 }
    );
  }
}
