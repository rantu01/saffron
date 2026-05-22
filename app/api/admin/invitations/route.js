import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

function generateCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const invitations = await db
      .collection("invitationCodes")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ success: true, invitations });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch invitation codes." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    let code = generateCode();
    let exists = await db.collection("invitationCodes").findOne({ code });

    while (exists) {
      code = generateCode();
      exists = await db.collection("invitationCodes").findOne({ code });
    }

    const now = new Date();
    const doc = {
      code,
      isActive: true,
      usedByUid: "",
      usedByEmail: "",
      usedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db.collection("invitationCodes").insertOne(doc);

    return NextResponse.json({
      success: true,
      invitation: { ...doc, _id: insertResult.insertedId },
      message: "Invitation code generated.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate invitation code." },
      { status: 500 }
    );
  }
}