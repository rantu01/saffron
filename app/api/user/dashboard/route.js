import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const user = await db.collection("users").findOne({ uid });
    const tasks = await db
      .collection("tasks")
      .find({ assigneeUid: uid })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      dashboard: {
        availableBalance: user?.availableBalance || 0,
        totalEarned: user?.totalEarned || 0,
        usdRate: 129,
        role: user?.role || "user",
        accountStatus: user?.accountStatus || "active",
        accountType: user?.accountType || (user?.isDemoAccount ? "demo" : "main"),
        isDemoAccount: Boolean(user?.isDemoAccount || user?.accountType === "demo"),
        inviterUid: user?.inviterUid || "",
        inviterEmail: user?.inviterEmail || "",
        freezeReason: user?.freezeReason || null,
        freezeThreshold: Number(user?.freezeThreshold || 0),
        demoProfitSharePercent: Number(user?.demoProfitSharePercent || 20),
        tasks,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load dashboard." },
      { status: 500 }
    );
  }
}