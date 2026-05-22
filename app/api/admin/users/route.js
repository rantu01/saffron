import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const users = await db
      .collection("users")
      .find({})
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch users." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { uid, role, availableBalance } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

    const update = { updatedAt: new Date() };
    if (typeof role === "string" && role) {
      update.role = role;
    }
    if (availableBalance !== undefined) {
      const numericBalance = Number(availableBalance);
      if (Number.isNaN(numericBalance)) {
        return NextResponse.json(
          { success: false, message: "availableBalance must be a number." },
          { status: 400 }
        );
      }
      update.availableBalance = numericBalance;
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    await db.collection("users").updateOne({ uid }, { $set: update });

    return NextResponse.json({ success: true, message: "User updated successfully." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "User update failed." },
      { status: 500 }
    );
  }
}