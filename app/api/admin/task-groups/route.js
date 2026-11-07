import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getVipTasksPerSet } from "@/lib/vipModel";
import { generateTasksForGroup } from "@/lib/taskGenerator";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

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
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch groups:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const { name, description, vipLevel } = body;

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
    const groupId = result.insertedId.toString();

    if (vipLevel) {
      const taskCount = getVipTasksPerSet(Number(vipLevel));
      const tasksToCreate = generateTasksForGroup(groupId, taskCount);
      if (tasksToCreate.length > 0) {
        await db.collection("tasks").insertMany(tasksToCreate);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Task group created successfully.",
      group: { ...group, _id: groupId },
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to create group:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
