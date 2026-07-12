import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const status = searchParams.get("status") || "all";

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const query = { assigneeUid: uid };
    if (status && status !== "all") {
      query.status = status;
    }

    const records = await db
      .collection("tasks")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const serialized = records.map((r) => ({
      _id: String(r._id),
      title: r.appName || r.description || "Untitled",
      status: r.status || "pending",
      rating: r.ratingOption || r.submissionConfig?.ratingOptions?.[0] || 5,
      imageUrl: r.appLogo || "",
      totalAmount: Number(r.totalAmount || r.requiredBalance || 0),
      profit: Number(r.profit || r.reward || r.earnedAmount || 0),
      currencyType: "USDCIT",
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ success: true, records: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch records" },
      { status: 500 }
    );
  }
}