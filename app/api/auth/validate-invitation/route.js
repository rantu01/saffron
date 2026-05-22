import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    const code = (body?.code || "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Invitation code is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || "saffron";
    const db = client.db(dbName);

    const invitation = await db.collection("invitationCodes").findOne({
      code,
      isActive: true,
    });

    if (!invitation || invitation.usedByUid) {
      return NextResponse.json(
        { success: false, message: "Invitation code is invalid or already used." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Invitation code is valid." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Validation failed." },
      { status: 500 }
    );
  }
}