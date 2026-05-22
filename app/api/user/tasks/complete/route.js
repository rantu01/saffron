import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    const { taskId, uid } = body;

    if (!taskId || !uid) {
      return NextResponse.json({ success: false, message: "taskId and uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const task = await db.collection("tasks").findOne({ _id: typeof taskId === 'string' ? new (require('mongodb').ObjectId)(taskId) : taskId });

    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    if (task.assigneeUid !== uid) {
      return NextResponse.json({ success: false, message: "Not authorized to complete this task" }, { status: 403 });
    }

    if (task.status === 'completed') {
      return NextResponse.json({ success: false, message: "Task already completed" }, { status: 400 });
    }

    const earned = Number(task.reward || 0);

    await db.collection("tasks").updateOne(
      { _id: task._id },
      { $set: { status: 'completed', completedAt: new Date(), earnedAmount: earned, updatedAt: new Date() } }
    );

    await db.collection("users").updateOne({ uid }, { $inc: { availableBalance: earned }, $set: { updatedAt: new Date() } });

    return NextResponse.json({ success: true, message: "Task marked completed", earned });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to complete task' }, { status: 500 });
  }
}