import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { initializeUserTaskSet } from "@/lib/taskSetModel";
import { buildTaskFinancialProfile, generateCombinationPositions } from "@/lib/taskModel";
import { computeTaskProfit, generateNormalTaskAmount } from "@/lib/comboTaskModel";
import { getVipTasksPerSet } from "@/lib/vipModel";
import { requireAdminUser, requireFirebaseAuth } from "@/lib/apiAuth";
import { createActivityLog } from "@/lib/activityLog";

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

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

    const assigneeUser = await db.collection("users").findOne({ uid: assigneeUid }, { projection: { vipLevel: 1, vipTasksPerSet: 1, availableBalance: 1 } });
    const assigneeVipTasks = Number(assigneeUser?.vipTasksPerSet || getVipTasksPerSet(assigneeUser?.vipLevel));

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

    // The number of tasks we actually assign is dictated by the assignee's VIP
    // level, NOT the full size of the template group. We only ever assign the
    // first `assigneeVipTasks` tasks.
    if (templateTasks.length < assigneeVipTasks) {
      return NextResponse.json(
        {
          success: false,
          message: `This group contains ${templateTasks.length} task(s), but VIP ${assigneeUser?.vipLevel || "?"} requires ${assigneeVipTasks} task(s) per set. Please choose a group with at least ${assigneeVipTasks} tasks.`,
        },
        { status: 400 }
      );
    }

    // Look at any previous assignment of this exact group to this user.
    const existingAssignments = await db
      .collection("tasks")
      .find({
        parentTaskGroupId: groupId,
        assigneeUid,
      })
      .toArray();

    if (existingAssignments.length > 0) {
      // Only block when the group is genuinely still in progress for the user
      // (an incomplete set that still has a pending task for this group).
      // A finished or "stuck" assignment is allowed to be re-issued as a fresh
      // set so it always remains accessible on the user dashboard.
      const assignedSetNumbers = [
        ...new Set(existingAssignments.map((t) => t.setNumber).filter((n) => n != null)),
      ];
      let inProgress = false;
      if (assignedSetNumbers.length) {
        const assignedSets = await db
          .collection("userTaskSets")
          .find({ uid: assigneeUid, setNumber: { $in: assignedSetNumbers } })
          .toArray();
        const incompleteSet = assignedSets.find(
          (s) => (s.completedTasks || 0) < (s.totalTasks || assigneeVipTasks)
        );
        if (incompleteSet) {
          inProgress = existingAssignments.some(
            (t) => t.setNumber === incompleteSet.setNumber && t.status === "pending"
          );
        }
      }
      if (inProgress) {
        return NextResponse.json(
          {
            success: false,
            message: "This group is already assigned and currently in progress for this user.",
          },
          { status: 409 }
        );
      }
    }

    // Each newly assigned group becomes its own task set (incrementing the
    // user's set number) so it never collides with an already-completed set
    // and is picked up immediately by the user dashboard.
    const lastSet = await db
      .collection("userTaskSets")
      .findOne({ uid: assigneeUid }, { sort: { setNumber: -1 } });
    const nextSetNumber = (lastSet?.setNumber || 0) + 1;

    // Resolve the daily group limit from the user's VIP level (centralized config),
    // falling back to the approved VIP matrix default.
    let dailyGroupLimit = 3;
    try {
      const assigneeUser = await db.collection("users").findOne({ uid: assigneeUid }, { projection: { vipLevel: 1 } });
      const { getVipTaskConfig } = await import("@/lib/vipModel");
      const cfg = await getVipTaskConfig(Number(assigneeUser?.vipLevel || 1));
      if (cfg && cfg.dailyGroupLimit) dailyGroupLimit = Number(cfg.dailyGroupLimit);
    } catch (e) {}
    const DAILY_GROUP_LIMIT = dailyGroupLimit;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const assignedToday = await db
      .collection("groupAssignments")
      .countDocuments({ assigneeUid, assignedAt: { $gte: startOfToday } });

    if (assignedToday >= DAILY_GROUP_LIMIT && !body.force) {
      return NextResponse.json(
        {
          success: false,
          needsConfirmation: true,
          assignedToday,
          dailyLimit: DAILY_GROUP_LIMIT,
          message: `You have already assigned ${DAILY_GROUP_LIMIT} task groups to this user today. Do you want to continue assigning additional groups?`,
        },
        { status: 200 }
      );
    }

    const combinationPositions = generateCombinationPositions();
    const now = new Date();

    // Only assign exactly the VIP-required number of tasks (the first N of the
    // group's templates). Never assign more or fewer than the VIP level demands.
    const slicedTemplates = templateTasks.slice(0, assigneeVipTasks);

    const tasksToInsert = slicedTemplates.map((t, index) => {
      const position = index + 1;
      const taskProfile = buildTaskFinancialProfile(t, position, nextSetNumber, combinationPositions);

      const userBalance = Number(assigneeUser?.availableBalance || 0);
      const computedAmount = generateNormalTaskAmount(userBalance);
      const assigneeVipLevel = Number(assigneeUser?.vipLevel || 1);
      const computedProfit = computeTaskProfit(computedAmount, assigneeVipLevel);

      return {
        appName: t.appName,
        appLogo: t.appLogo || "",
        description: t.description || "",
        totalAmount: computedAmount,
        profit: computedProfit,
        reward: computedProfit,
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

    await initializeUserTaskSet(assigneeUid, nextSetNumber, { totalTasks: assigneeVipTasks });

    const insertedTasks = tasksToInsert.map((t, i) => ({
      ...t,
      _id: result.insertedIds[i],
    }));

    await db.collection("groupAssignments").insertOne({
      groupId: groupId.toString(),
      groupName: group.name,
      assigneeUid,
      assigneeEmail: assigneeEmail || "",
      assignedAt: now,
    });

    const updatedAssignedToday = await db
      .collection("groupAssignments")
      .countDocuments({ assigneeUid, assignedAt: { $gte: startOfToday } });

    try {
      await createActivityLog({
        actorUid: authContext.uid,
        actorEmail: authContext.user?.email || "",
        actorRole: authContext.user?.role || "",
        action: "taskgroup.assign",
        targetType: "taskGroup",
        targetId: groupId,
        targetSnapshot: { groupId, groupName: group.name, assigneeUid },
        before: null,
        after: { assigneeUid, setNumber: nextSetNumber, count: insertedTasks.length },
        reason: "",
        metadata: { groupId, assigneeUid },
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
        userAgent: request.headers.get("user-agent") || "",
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Group "${group.name}" assigned with ${insertedTasks.length} tasks.`,
      tasks: insertedTasks,
      createdCount: insertedTasks.length,
      groupName: group.name,
      assignedToday: updatedAssignedToday,
      dailyLimit: DAILY_GROUP_LIMIT,
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    if (status === 500) {
      console.error("Failed to group assignment:", error);
    }

    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
