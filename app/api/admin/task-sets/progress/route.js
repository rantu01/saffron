import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getDailyLimitStatus } from "@/lib/taskSetModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const taskSets = await db
      .collection("userTaskSets")
      .find({ uid })
      .sort({ setNumber: -1 })
      .toArray();

    const dailyLimit = await getDailyLimitStatus(uid);

    const enrichedSets = taskSets.map((s) => {
      const total = Number(s.totalTasks || 0);
      const completed = Number(s.completedTasks || 0);
      return {
        ...s,
        totalTasks: total,
        completedTasks: completed,
        remainingTasks: Math.max(0, total - completed),
      };
    });

    return NextResponse.json({ success: true, taskSets: enrichedSets, dailyLimit });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch task sets:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
