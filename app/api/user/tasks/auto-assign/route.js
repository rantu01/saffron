import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { initializeUserTaskSet } from "@/lib/taskSetModel";
import { buildTaskFinancialProfile, generateCombinationPositions } from "@/lib/taskModel";
import { getComboConfig, shouldGenerateComboTask, createComboTask, getComboPosition, generateNormalTaskAmount, computeTaskProfit } from "@/lib/comboTaskModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const user = await db.collection("users").findOne({ uid });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const userBalance = Number(user.availableBalance || 0);

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

    const comboConfig = await getComboConfig();
    const hasComboTask = shouldGenerateComboTask(comboConfig);
    let comboTaskId = null;
    let comboPosition = null;

    if (hasComboTask) {
      const comboResult = await createComboTask(uid, nextSetNumber, comboConfig, userBalance);
      if (comboResult) {
        comboTaskId = String(comboResult._id);
        comboPosition = comboResult.position;
      }
    }

    const combinationPositions = generateCombinationPositions();
    const now = new Date();

    const tasksToInsert = templateTasks.map((t, index) => {
      const position = index + 1;
      const isComboPosition = hasComboTask && position === comboPosition;

      if (isComboPosition) {
        return {
          appName: "Combined Task",
          appLogo: t.appLogo || "",
          description: "Complete all linked orders sequentially",
          totalAmount: 0,
          profit: 0,
          reward: 0,
          submissionConfig: null,
          isTemplate: false,
          parentTaskId: t._id.toString(),
          parentTaskGroupId: availableGroup._id,
          assigneeUid: uid,
          assigneeEmail: "",
          status: "pending",
          position,
          setNumber: nextSetNumber,
          taskType: "combo",
          isCombinationTask: false,
          isComboTask: true,
          comboId: comboTaskId,
          profitMultiplier: 1,
          requiredBalance: 0,
          combinationPositions: [],
          combinationSlots: [],
          createdAt: now,
          updatedAt: now,
        };
      }

      const taskProfile = buildTaskFinancialProfile(t, position, nextSetNumber, combinationPositions);
      const generatedAmount = generateNormalTaskAmount(userBalance);
      const generatedProfit = computeTaskProfit(generatedAmount);

      return {
        appName: t.appName,
        appLogo: t.appLogo || "",
        description: t.description || "",
        totalAmount: generatedAmount,
        profit: generatedProfit,
        reward: generatedProfit,
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
        isComboTask: false,
        comboId: null,
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
      hasComboTask,
      comboPosition,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Auto-assignment failed." },
      { status: 500 }
    );
  }
}
