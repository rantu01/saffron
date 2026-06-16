import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const groups = await db
      .collection("taskGroups")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const taskCounts = await db
      .collection("tasks")
      .aggregate([
        { $match: { isTemplate: true, taskGroupId: { $ne: null } } },
        { $group: { _id: "$taskGroupId", count: { $sum: 1 } } },
      ])
      .toArray();

    const countMap = {};
    for (const item of taskCounts) {
      countMap[item._id] = item.count;
    }

    const result = groups.map((g) => ({
      ...g,
      _id: g._id.toString(),
      taskCount: countMap[g._id.toString()] || 0,
    }));

    return NextResponse.json({ success: true, groups: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch groups." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Group name is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const now = new Date();
    const group = {
      name: name.trim(),
      description: description || "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("taskGroups").insertOne(group);

    return NextResponse.json({
      success: true,
      message: "Task group created successfully.",
      group: { ...group, _id: result.insertedId.toString() },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create group." },
      { status: 500 }
    );
  }
}
