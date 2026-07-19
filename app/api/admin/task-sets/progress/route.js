import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getDailyLimitStatus } from "@/lib/taskSetModel";

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
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch task sets" },
      { status: 500 }
    );
  }
}
