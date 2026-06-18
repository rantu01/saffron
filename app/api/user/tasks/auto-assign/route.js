import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { initializeUserTaskSet } from "@/lib/taskSetModel";
import { buildTaskFinancialProfile, generateCombinationPositions } from "@/lib/taskModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const assignedGroupIds = await db
      .collection("tasks")
      .distinct("parentTaskGroupId", {
        assigneeUid: uid,
        parentTaskGroupId: { $ne: null, $exists: true },
      });

    const allGroups = await db
      .collection("taskGroups")
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    let availableGroup = null;
    for (const group of allGroups) {
      const gid = group._id.toString();
      if (assignedGroupIds.includes(gid)) continue;

      const templateCount = await db
        .collection("tasks")
        .countDocuments({ taskGroupId: gid, isTemplate: true });

      if (templateCount > 0) {
        availableGroup = { ...group, _id: gid };
        break;
      }
    }

    if (!availableGroup) {
      return NextResponse.json({
        success: true,
        assigned: false,
        noGroups: true,
        message: "No task groups available.",
      });
    }

    const existingSets = await db
      .collection("userTaskSets")
      .find({ uid })
      .sort({ setNumber: -1 })
      .toArray();

    const nextSetNumber = existingSets.length > 0 ? existingSets[0].setNumber + 1 : 1;

    const templateTasks = await db
      .collection("tasks")
      .find({ taskGroupId: availableGroup._id, isTemplate: true })
      .sort({ createdAt: 1 })
      .toArray();

    if (templateTasks.length === 0) {
      return NextResponse.json({
        success: true,
        assigned: false,
        noGroups: true,
        message: "No task groups available.",
      });
    }

    const combinationPositions = generateCombinationPositions();
    const now = new Date();

    const tasksToInsert = templateTasks.map((t, index) => {
      const position = index + 1;
      const taskProfile = buildTaskFinancialProfile(t, position, nextSetNumber, combinationPositions);

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
        parentTaskGroupId: availableGroup._id,
        assigneeUid: uid,
        assigneeEmail: "",
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
    await initializeUserTaskSet(uid, nextSetNumber);

    return NextResponse.json({
      success: true,
      assigned: true,
      message: `Group "${availableGroup.name}" assigned with ${tasksToInsert.length} tasks.`,
      groupName: availableGroup.name,
      createdCount: tasksToInsert.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Auto-assignment failed." },
      { status: 500 }
    );
  }
}
