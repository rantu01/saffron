import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getVipTasksPerSet } from "@/lib/vipModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { taskIds, assigneeUid, assigneeEmail } = body;

    if (!taskIds?.length || !assigneeUid) {
      return NextResponse.json(
        { success: false, message: "taskIds and assigneeUid are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const userDoc = await db.collection("users").findOne({ uid: assigneeUid }, { projection: { vipLevel: 1, vipTasksPerSet: 1 } });
    const maxTasks = Number(userDoc?.vipTasksPerSet || getVipTasksPerSet(userDoc?.vipLevel));

    if (taskIds.length > maxTasks) {
      return NextResponse.json(
        { success: false, message: `Cannot assign more than ${maxTasks} tasks at once.` },
        { status: 400 }
      );
    }

    const objectIds = taskIds.map((id) => typeof id === "string" ? new ObjectId(id) : id);

    const templateTasks = await db.collection("tasks").find({
      _id: { $in: objectIds },
    }).toArray();

    if (!templateTasks.length) {
      return NextResponse.json(
        { success: false, message: "No tasks found with the provided IDs." },
        { status: 404 }
      );
    }

    const templateIds = templateTasks.map((t) => t._id.toString());

    const existingAssignments = await db.collection("tasks").find({
      parentTaskId: { $in: templateIds },
      assigneeUid,
    }).project({ parentTaskId: 1 }).toArray();

    const alreadyAssignedIds = new Set(existingAssignments.map((t) => t.parentTaskId));

    const newTasks = templateTasks.filter((t) => !alreadyAssignedIds.has(t._id.toString()));
    const duplicateIds = templateTasks.filter((t) => alreadyAssignedIds.has(t._id.toString()));

    if (!newTasks.length) {
      return NextResponse.json({
        success: false,
        message: "All selected tasks have already been assigned to this user. Please create new tasks instead.",
        duplicates: duplicateIds.map((t) => ({ _id: t._id.toString(), appName: t.appName })),
      }, { status: 409 });
    }

    const now = new Date();
    const tasksToInsert = newTasks.map((t) => ({
      appName: t.appName,
      appLogo: t.appLogo || "",
      description: t.description || "",
      totalAmount: t.totalAmount,
      profit: t.profit,
      reward: t.profit,
      submissionConfig: t.submissionConfig,
      isTemplate: false,
      parentTaskId: t._id.toString(),
      assigneeUid,
      assigneeEmail: assigneeEmail || "",
      status: "pending",
      position: 0,
      setNumber: 1,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await db.collection("tasks").insertMany(tasksToInsert);

    const insertedTasks = tasksToInsert.map((t, i) => ({ ...t, _id: result.insertedIds[i] }));

    return NextResponse.json({
      success: true,
      message: `${insertedTasks.length} task(s) assigned successfully.`,
      tasks: insertedTasks,
      createdCount: insertedTasks.length,
      duplicates: duplicateIds.map((t) => ({ _id: t._id.toString(), appName: t.appName })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Task assignment failed." },
      { status: 500 }
    );
  }
}
