import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { initializeUserTaskSet } from "@/lib/taskSetModel";
import { buildTaskFinancialProfile, generateCombinationPositions, roundCurrency } from "@/lib/taskModel";
import { getComboConfig, createStageComboTask, isEligibleForFirstCombo, isEligibleForSecondCombo, getComboPosition, generateNormalTaskAmount, NORMAL_COMMISSION_RATE } from "@/lib/comboTaskModel";
import { getDailyLimitStatus } from "@/lib/taskSetModel";
import { getVipTaskConfig } from "@/lib/vipModel";

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

    // Daily task limit: block assigning a new set once the user has completed
    // DAILY_SET_LIMIT full sets earlier today.
    const dailyLimit = await getDailyLimitStatus(uid);
    if (dailyLimit.reached) {
      return NextResponse.json({
        success: true,
        assigned: false,
        dailyLimitReached: true,
        message: "Try again in 24 hours.",
      });
    }

    const userBalance = Number(user.availableBalance || 0);

    // VIP tier controls how many tasks are generated per set and the profit rate.
    const vipConfig = getVipTaskConfig(Number(user.vipLevel || 1));
    const tasksPerSet = Math.max(1, Number(user.vipTasksPerSet || vipConfig.tasksPerSet));
    const vipProfitIncrease = Number(user.vipProfitIncrease || vipConfig.profitIncrease);

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

    if (allGroups.length === 0) {
      return NextResponse.json({
        success: true,
        assigned: false,
        noGroups: true,
        message: "No task groups available.",
      });
    }

    // Assign groups sequentially and reuse them across cycles (Set N uses the
    // group at index (N-1) % totalGroups). Reusing previous sets is allowed.
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
      // All groups already assigned in this cycle: cycle back and reuse them.
      const fallbackSets = await db
        .collection("userTaskSets")
        .find({ uid })
        .sort({ setNumber: -1 })
        .toArray();
      const fallbackNext = fallbackSets.length > 0 ? fallbackSets[0].setNumber + 1 : 1;
      const groupIndex = (fallbackNext - 1) % allGroups.length;
      const reused = allGroups[groupIndex];
      const reusedId = reused._id.toString();
      const templateCount = await db
        .collection("tasks")
        .countDocuments({ taskGroupId: reusedId, isTemplate: true });
      if (templateCount > 0) {
        availableGroup = { ...reused, _id: reusedId };
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

    // Apply the VIP tier's tasks-per-set size. If the group has fewer templates
    // than the tier size we keep whatever templates exist; otherwise we take the
    // first `tasksPerSet` templates.
    const slicedTemplates = templateTasks.slice(0, tasksPerSet);

    const comboConfig = await getComboConfig();
    let hasComboTask = false;
    let comboTaskId = null;
    let comboPosition = null;

    const isFirstComboEligible = await isEligibleForFirstCombo(user, comboConfig);
    const isSecondComboEligible = await isEligibleForSecondCombo(user, comboConfig);

    if (isFirstComboEligible) {
      const comboResult = await createStageComboTask(uid, nextSetNumber, comboConfig, 1);
      if (comboResult) {
        comboTaskId = String(comboResult._id);
        comboPosition = comboResult.position;
        hasComboTask = true;
      }
    } else if (isSecondComboEligible) {
      const comboResult = await createStageComboTask(uid, nextSetNumber, comboConfig, 2);
      if (comboResult) {
        comboTaskId = String(comboResult._id);
        comboPosition = comboResult.position;
        hasComboTask = true;
      }
    }

    const combinationPositions = generateCombinationPositions();
    const now = new Date();

    const tasksToInsert = slicedTemplates.map((t, index) => {
      const position = index + 1;
      // Clamp the combo position to the (possibly reduced) set size so it never
      // falls outside the assigned tasks.
      const clampedComboPosition = hasComboTask ? Math.min(comboPosition, slicedTemplates.length) : null;
      const isComboPosition = hasComboTask && position === clampedComboPosition;

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
      const generatedProfit = roundCurrency(generatedAmount * (NORMAL_COMMISSION_RATE + vipProfitIncrease / 100));

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
    await initializeUserTaskSet(uid, nextSetNumber, { totalTasks: slicedTemplates.length });

    return NextResponse.json({
      success: true,
      assigned: true,
      message: `Group "${availableGroup.name}" assigned with ${tasksToInsert.length} tasks (VIP ${Number(user.vipLevel || 1)}).`,
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
