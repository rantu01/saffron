import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

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

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || "saffron";
    const db = client.db(dbName);

    if (invitationCode) {
      const normalizedCode = invitationCode.trim().toUpperCase();
      const codeDoc = await db.collection("invitationCodes").findOne({
        code: normalizedCode,
        isActive: true,
      });

      if (!codeDoc || codeDoc.usedByUid) {
        return NextResponse.json(
          { success: false, message: "Invalid or already used invitation code." },
          { status: 400 }
        );
      }

      await db.collection("invitationCodes").updateOne(
        { _id: codeDoc._id },
        {
          $set: {
            usedByUid: uid,
            usedByEmail: email,
            usedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    }

    await db.collection("users").updateOne(
      { uid },
      {
        $set: {
          email,
          displayName: displayName || "",
          phoneNumber: phoneNumber || "",
          invitationCode: invitationCode || "",
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          role: "user",
          availableBalance: 0,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "User synced." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Sync failed." },
      { status: 500 }
    );
  }
}