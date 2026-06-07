import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("saffron");

    const taskSets = await db
      .collection("userTaskSets")
      .find({ uid })
      .sort({ setNumber: -1 })
      .toArray();

    return NextResponse.json({ success: true, taskSets });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch task sets" },
      { status: 500 }
    );
  }
}
