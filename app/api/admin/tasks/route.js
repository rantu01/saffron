import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assigneeUid = searchParams.get("assigneeUid");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const query = assigneeUid ? { assigneeUid } : {};
    const tasks = await db
      .collection("tasks")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch tasks." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, assigneeUid, assigneeEmail, reward } = body;

    if (!title || !assigneeUid) {
      return NextResponse.json(
        { success: false, message: "title and assigneeUid are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const now = new Date();
    const task = {
      title,
      description: description || "",
      assigneeUid,
      assigneeEmail: assigneeEmail || "",
      reward: Number(reward || 0),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("tasks").insertOne(task);

    return NextResponse.json({
      success: true,
      message: "Task assigned successfully.",
      task: { ...task, _id: result.insertedId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Task assignment failed." },
      { status: 500 }
    );
  }
}