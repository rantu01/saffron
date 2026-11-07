import { NextResponse } from "next/server";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";
import clientPromise from "@/lib/mongodb";

export async function GET(request, { params }) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
    const { ObjectId } = await import("mongodb");
    const doc = await db.collection("termsVersions").findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ success: false, message: "Version not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, version: doc });
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