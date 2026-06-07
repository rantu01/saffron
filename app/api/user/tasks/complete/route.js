import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getUserTaskSetProgress, initializeUserTaskSet } from "@/lib/taskSetModel";
import { ObjectId } from "mongodb";
import { buildTaskFinancialProfile, getTaskRequiredBalance, getTaskRewardMultiplier, isCombinationTask, getCombinationReward, roundCurrency } from "@/lib/taskModel";
import { creditUserBalance, freezeUserForBalance, getUserByUid, isDemoUser } from "@/lib/userModel";
import { createBalanceLog } from "@/lib/balanceLog";
import { getWhatsAppSettings } from "@/lib/whatsappSettingsModel";
import { sendTaskCompleted, sendBalanceFrozen } from "@/lib/whatsappService";

export async function POST(request) {
  try {
    const body = await request.json();
    const { taskId, uid } = body;

    if (!taskId || !uid) {
      return NextResponse.json({ success: false, message: "taskId and uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const task = await db.collection("tasks").findOne({ _id: typeof taskId === 'string' ? new ObjectId(taskId) : taskId });

    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    if (task.assigneeUid !== uid) {
      return NextResponse.json({ success: false, message: "Not authorized to complete this task" }, { status: 403 });
    }

    if (task.status === 'completed') {
      return NextResponse.json({ success: false, message: "Task already completed" }, { status: 400 });
    }

    const user = await getUserByUid(uid);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (user.accountStatus === "frozen" && user.freezeReason !== "balance_requirement") {
      return NextResponse.json({ success: false, message: "Your account is frozen." }, { status: 403 });
    }

    // Initialize user task set if needed
    let setProgress = await getUserTaskSetProgress(uid);
    if (!setProgress) {
      await initializeUserTaskSet(uid, task.setNumber || 1);
      setProgress = await getUserTaskSetProgress(uid);
    }

    // Check if task is at current position (sequential check)
    const expectedPosition = setProgress.currentPosition + 1;
    if ((task.position || 1) !== expectedPosition) {
      return NextResponse.json({
        success: false,
        message: `Complete task ${expectedPosition} first`,
        currentPosition: setProgress.currentPosition,
        expectedPosition,
      }, { status: 400 });
    }

    const taskFinancialProfile = buildTaskFinancialProfile(task, task.position, task.setNumber);
    const requiredBalance = getTaskRequiredBalance(taskFinancialProfile);

    if (Number(user.availableBalance || 0) < requiredBalance) {
      await freezeUserForBalance(uid, requiredBalance, {
        taskId: String(task._id),
        taskSetNumber: task.setNumber || 1,
        taskPosition: task.position || 1,
      });

      const wsSettings = await getWhatsAppSettings();
      if (wsSettings?.enabled && wsSettings.notifyOnBalanceFreeze !== false && user.phoneNumber) {
        const name = user.displayName || user.email || "User";
        sendBalanceFrozen(user.phoneNumber, name, requiredBalance, user.availableBalance || 0).catch(() => {});
      }

      return NextResponse.json(
        {
          success: false,
          message: `Your account is temporarily frozen. Please maintain a balance of $${requiredBalance} to continue.`,
          requiredBalance,
          accountStatus: "frozen",
        },
        { status: 400 }
      );
    }

    const comboTask = isCombinationTask(taskFinancialProfile);
    let baseReward = Number(task.reward || 0);
    let multiplier = getTaskRewardMultiplier(taskFinancialProfile);
    let earned = baseReward * multiplier;
    let comboProfitInfo = null;

    if (comboTask && task.combinationPositions) {
      comboProfitInfo = getCombinationReward(task.combinationPositions, task.position, 30);
      if (comboProfitInfo) {
        earned = roundCurrency(baseReward * multiplier + baseReward * comboProfitInfo.baseRewardFraction);
      }
    }

    await db.collection("tasks").updateOne(
      { _id: task._id },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
          earnedAmount: earned,
          isCombinationTask: comboTask,
          multiplier,
          requiredBalance,
          taskType: taskFinancialProfile.taskType,
          profitPercent: comboProfitInfo?.profitPercent || (comboTask ? 25 : 0),
          updatedAt: new Date(),
        },
      }
    );

    await creditUserBalance(uid, earned, { autoResolveFreeze: true });
    const userAfterTask = await getUserByUid(uid);

    await createBalanceLog({
      uid,
      email: user?.email || "",
      type: "task_earnings",
      amount: earned,
      balanceBefore: Number(user.availableBalance || 0),
      balanceAfter: Number(userAfterTask?.availableBalance || 0),
      description: `Task completed: ${task.title || "Task"} (${comboTask ? `${multiplier}x combo` : `${multiplier}x`})`,
      referenceId: String(task._id),
      referenceType: "task",
      metadata: { taskPosition: task.position, isCombinationTask: comboTask, multiplier },
    });

    let inviterShareAmount = 0;
    if (isDemoUser(user) && user.inviterUid) {
      const sharePercent = Number(user.demoProfitSharePercent || 20);
      inviterShareAmount = (earned * sharePercent) / 100;

      const inviter = await getUserByUid(user.inviterUid);
      if (inviter && inviter.accountType !== "demo") {
        const inviterBefore = Number(inviter.availableBalance || 0);
        await creditUserBalance(user.inviterUid, inviterShareAmount, { autoResolveFreeze: true });
        const inviterAfter = await getUserByUid(user.inviterUid);
        await createBalanceLog({
          uid: user.inviterUid,
          email: inviter.email || "",
          type: "referral_commission",
          amount: inviterShareAmount,
          balanceBefore: inviterBefore,
          balanceAfter: Number(inviterAfter?.availableBalance || 0),
          description: `Referral commission from ${user.email || uid} (${sharePercent}%)`,
          referenceId: String(task._id),
          referenceType: "task_referral",
          metadata: { sourceUid: uid, sourceEmail: user.email, sharePercent },
        });
      } else {
        inviterShareAmount = 0;
      }
    }

    // Update task set progress
    const updatedSetProgress = await db.collection("userTaskSets").findOneAndUpdate(
      { uid, setNumber: task.setNumber || 1 },
      { $inc: { completedTasks: 1, currentPosition: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    const wsSettings = await getWhatsAppSettings();
    if (wsSettings?.enabled && wsSettings.notifyOnTaskComplete !== false && user.phoneNumber) {
      const name = user.displayName || user.email || "User";
      sendTaskCompleted(user.phoneNumber, name, task.title, earned, userAfterTask?.availableBalance || 0).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Task marked completed",
      earned,
      baseReward,
      multiplier,
      requiredBalance,
      inviterShareAmount,
      isCombinationTask: comboTask,
      profitPercent: comboProfitInfo?.profitPercent || 0,
      combinationPositions: task.combinationPositions || [],
      setProgress: updatedSetProgress.value,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to complete task' }, { status: 500 });
  }
}