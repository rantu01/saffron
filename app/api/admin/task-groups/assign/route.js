import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { initializeUserTaskSet } from "@/lib/taskSetModel";
import { buildTaskFinancialProfile, generateCombinationPositions } from "@/lib/taskModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, assigneeUid, assigneeEmail } = body;

    if (!groupId || !assigneeUid) {
      return NextResponse.json(
        { success: false, message: "groupId and assigneeUid are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const group = await db.collection("taskGroups").findOne({ _id: new ObjectId(groupId) });
    if (!group) {
      return NextResponse.json(
        { success: false, message: "Task group not found." },
        { status: 404 }
      );
    }

    const templateTasks = await db
      .collection("tasks")
      .find({ taskGroupId: groupId, isTemplate: true })
      .sort({ createdAt: 1 })
      .toArray();

    if (!templateTasks.length) {
      return NextResponse.json(
        { success: false, message: "No tasks found in this group." },
        { status: 404 }
      );
    }

    if (templateTasks.length > 30) {
      return NextResponse.json(
        { success: false, message: "Group has more than 30 tasks. Please adjust." },
        { status: 400 }
      );
    }

    const existingAssignments = await db
      .collection("tasks")
      .find({
        parentTaskGroupId: groupId,
        assigneeUid,
      })
      .count();

    if (existingAssignments > 0) {
      return NextResponse.json(
        { success: false, message: "This group has already been assigned to this user." },
        { status: 409 }
      );
    }

    const combinationPositions = generateCombinationPositions();
    const now = new Date();

    const tasksToInsert = templateTasks.map((t, index) => {
      const position = index + 1;
      const taskProfile = buildTaskFinancialProfile(t, position, 1, combinationPositions);

      return {
        appName: t.appName,
        appLogo: t.appLogo || "",
        description: t.description || "",
        totalAmount: t.totalAmount,
        profit: t.profit,
        reward: t.profit,
        submissionConfig: t.submissionConfig,
        isTemplate: false,
        parentTaskId: t._id.toString(),
        parentTaskGroupId: groupId,
        assigneeUid,
        assigneeEmail: assigneeEmail || "",
        status: "pending",
        position: taskProfile.position,
        setNumber: taskProfile.setNumber,
        taskType: taskProfile.taskType,
        isCombinationTask: taskProfile.isCombinationTask,
        profitMultiplier: taskProfile.profitMultiplier,
        requiredBalance: taskProfile.requiredBalance,
        combinationPositions: taskProfile.combinationPositions,
        combinationSlots: taskProfile.isCombinationTask ? taskProfile.combinationPositions : [],
        createdAt: now,
        updatedAt: now,
      };
    });

    const result = await db.collection("tasks").insertMany(tasksToInsert);

    await initializeUserTaskSet(assigneeUid, 1);

    const insertedTasks = tasksToInsert.map((t, i) => ({
      ...t,
      _id: result.insertedIds[i],
    }));

    return NextResponse.json({
      success: true,
      message: `Group "${group.name}" assigned with ${insertedTasks.length} tasks.`,
      tasks: insertedTasks,
      createdCount: insertedTasks.length,
      groupName: group.name,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Group assignment failed." },
      { status: 500 }
    );
  }
}
