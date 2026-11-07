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

import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || "100")));
    const skip = (page - 1) * limit;

    const [invitations, total] = await Promise.all([
      db.collection("invitationCodes").find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("invitationCodes").countDocuments({}),
    ]);

    return NextResponse.json({ success: true, invitations, total, page, limit });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch invitation codes:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json().catch(() => ({}));
    const createdByUid = typeof body.createdByUid === "string" ? body.createdByUid : "";
    const createdByEmail = typeof body.createdByEmail === "string" ? body.createdByEmail : "";
    const createdByName = typeof body.createdByName === "string" ? body.createdByName : "";

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    let reusable = false;

    if (createdByUid) {
      const existing = await db
        .collection("invitationCodes")
        .findOne({ createdByUid, isActive: true });

      if (existing) {
        return NextResponse.json({
          success: true,
          invitation: existing,
          message: "This user already has a referral code.",
        });
      }

      const owner = await db.collection("users").findOne({ uid: createdByUid });
      reusable = Boolean(owner?.referralCodeReusable);
    }

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
      createdByUid,
      createdByEmail,
      createdByName,
      reusable: Boolean(reusable),
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
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to generate invitation code:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}