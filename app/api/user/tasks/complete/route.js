import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { creditUserBalance, getUserByUid } from "@/lib/userModel";
import { createBalanceLog } from "@/lib/balanceLog";
import { roundCurrency } from "@/lib/taskModel";
import { getActiveComboTask, NORMAL_COMMISSION_RATE } from "@/lib/comboTaskModel";
import { getDailyLimitStatus, markSetCompletedToday } from "@/lib/taskSetModel";
import { evaluateVipEligibility } from "@/lib/vipModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { taskId, uid, feedback, ratingOption } = body;

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

    if (task.status === 'cancelled') {
      return NextResponse.json({ success: false, message: "Task was cancelled." }, { status: 400 });
    }

    if (task.isComboTask && task.taskType === "combo") {
      const activeCombo = await db.collection("comboTasks").findOne({
        _id: new ObjectId(task.comboId),
        uid,
      });
      if (activeCombo && activeCombo.status === "completed") {
      } else if (activeCombo && activeCombo.status !== "completed") {
        return NextResponse.json({
          success: false,
          message: "Complete all linked orders in the Combined Task first.",
          comboStatus: activeCombo.status,
        }, { status: 400 });
      }
    }

    if (!task.isComboTask) {
      const activeCombo = await getActiveComboTask(uid, task.setNumber || 1);
      if (activeCombo && activeCombo.status !== "pending" && task.position > 0 && activeCombo.position <= task.position) {
        return NextResponse.json({
          success: false,
          message: "A Combined Task is in progress. Complete it before continuing with other tasks.",
          comboStatus: activeCombo.status,
        }, { status: 400 });
      }
    }

    // Validate submission based on task's submissionConfig
    const subConfig = task.submissionConfig;
    if (subConfig) {
      if (subConfig.requireRating !== false) {
        if (!ratingOption) {
          return NextResponse.json({ success: false, message: "Rating selection is required." }, { status: 400 });
        }
        if (Array.isArray(subConfig.ratingOptions) && subConfig.ratingOptions.length && !subConfig.ratingOptions.includes(ratingOption)) {
          return NextResponse.json({ success: false, message: "Invalid rating option selected." }, { status: 400 });
        }
      }
      if (subConfig.requireFeedback !== false) {
        if (!feedback || !feedback.trim()) {
          return NextResponse.json({ success: false, message: "Feedback is required." }, { status: 400 });
        }
        const maxLen = Math.min(Math.max(Number(subConfig.maxFeedbackLength) || 500, 1), 5000);
        if (feedback.length > maxLen) {
          return NextResponse.json({ success: false, message: `Feedback exceeds ${maxLen} character limit.` }, { status: 400 });
        }
      }
    }

    const user = await getUserByUid(uid);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Daily task limit: a user may complete at most DAILY_SET_LIMIT full sets per
    // day. Block starting/completing further tasks once the limit is reached.
    const dailyLimit = await getDailyLimitStatus(uid);
    if (dailyLimit.reached) {
      return NextResponse.json({
        success: false,
        dailyLimitReached: true,
        message: "Try again in 24 hours.",
      }, { status: 400 });
    }

    const userDebt = Number(user.comboDebt || 0);
    if (userDebt > 0) {
      return NextResponse.json({
        success: false,
        message: `You have an outstanding debt of $${userDebt.toFixed(2)}. Please deposit to clear it before continuing.`,
        comboDebt: userDebt,
      }, { status: 400 });
    }

    const totalAmount = Number(task.totalAmount || 0);
    const profit = roundCurrency(totalAmount * NORMAL_COMMISSION_RATE);
    // Only the profit is "earned". The task principal is reserved (frozen) while
    // the task is pending and returned to the wallet on completion — it is never
    // credited as earnings.
    const earned = profit;

    const updateFields = {
      status: 'completed',
      completedAt: new Date(),
      earnedAmount: earned,
      updatedAt: new Date(),
    };

    if (feedback !== undefined) updateFields.feedback = feedback;
    if (ratingOption !== undefined) updateFields.ratingOption = ratingOption;

    await db.collection("tasks").updateOne(
      { _id: task._id },
      { $set: updateFields }
    );

    // Return the reserved principal to Main Balance and credit only the profit.
    const frozenAmount = Number(task.frozenAmount || 0);
    const balanceBefore = Number(user.availableBalance || 0);
    let frozenBalanceAfter = Number(user.frozenBalance || 0);

    if (frozenAmount > 0) {
      await db.collection("users").updateOne(
        { uid },
        {
          $inc: {
            availableBalance: frozenAmount,
            frozenBalance: -frozenAmount,
          },
          $set: { firstTaskStarted: true, updatedAt: new Date() },
        }
      );
      await db.collection("tasks").updateOne(
        { _id: task._id },
        { $set: { frozenAmount: 0, startedWithoutSubmit: false, updatedAt: new Date() } }
      );
      frozenBalanceAfter = roundCurrency(frozenBalanceAfter - frozenAmount);
    } else {
      await db.collection("users").updateOne(
        { uid },
        { $set: { firstTaskStarted: true, updatedAt: new Date() } }
      );
    }

    // Credit only the profit (this updates totalEarned and resolves any account
    // freeze state). The principal has already been returned above.
    await creditUserBalance(uid, profit, { autoResolveFreeze: true });
    const userAfterTask = await getUserByUid(uid);
    const balanceAfter = Number(userAfterTask?.availableBalance || 0);

    // Check VIP eligibility (creates a pending admin request if qualified).
    await evaluateVipEligibility(uid).catch(() => {});

    await createBalanceLog({
      uid,
      email: user?.email || "",
      type: "task_earnings",
      amount: profit,
      balanceBefore,
      balanceAfter,
      description: `Task completed: ${task.appName || task.title || "Task"} (profit $${profit})`,
      referenceId: String(task._id),
      referenceType: "task",
      metadata: { totalAmount, profit, appName: task.appName },
    });

    // Referral profit sharing: 20% of profit goes to the inviter or parent (for training accounts)
    const isDemo = user?.isDemoAccount || user?.accountType === "demo" || user?.accountType === "training";
    const targetUid = user.accountType === "training" ? (user.parentUid || user.inviterUid) : user.inviterUid;
    if (isDemo && targetUid && profit > 0) {
      const sharePercent = Number(user?.demoProfitSharePercent || 20);
      const shareAmount = roundCurrency(profit * sharePercent / 100);

      if (shareAmount > 0) {
        const inviterBefore = await getUserByUid(targetUid);
        const inviterBalBefore = Number(inviterBefore?.availableBalance || 0);

        await creditUserBalance(targetUid, shareAmount, { autoResolveFreeze: true });

        const inviterAfter = await getUserByUid(user.inviterUid);
        const inviterBalAfter = Number(inviterAfter?.availableBalance || 0);

        await db.collection("users").updateOne(
          { uid },
          { $inc: { totalDemoProfitShared: shareAmount }, $set: { updatedAt: new Date() } }
        );

        await createBalanceLog({
          uid: targetUid,
          email: inviterBefore?.email || "",
          type: "referral_commission",
          amount: shareAmount,
          balanceBefore: inviterBalBefore,
          balanceAfter: inviterBalAfter,
          description: `Referral commission (20% of $${profit} profit from ${user.email || uid})`,
          referenceId: String(task._id),
          referenceType: "task",
          metadata: { sourceUid: uid, sourceEmail: user.email, profit, sharePercent, taskApp: task.appName },
        });

        await db.collection("notifications").insertOne({
          uid: targetUid,
          type: "referral_commission",
          title: "Referral Commission Received!",
          message: `You earned $${shareAmount.toFixed(2)} commission from your referral's task profit.`,
          isRead: false,
          metadata: { amount: shareAmount, sourceUid: uid, sourceEmail: user.email },
          createdAt: new Date(),
        }).catch(() => {});
      }
    }

    // Update task set progress if using set system
    const updatedSet = await db.collection("userTaskSets").findOneAndUpdate(
      { uid, setNumber: task.setNumber || 1 },
      { $inc: { completedTasks: 1, currentPosition: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    ).catch(() => null);

    const setComplete = updatedSet?.value
      ? (updatedSet.value.completedTasks || 0) >= (updatedSet.value.totalTasks || 30)
      : false;

    if (setComplete && updatedSet?.value) {
      await markSetCompletedToday(uid, updatedSet.value.setNumber);
    }

    return NextResponse.json({
      success: true,
      message: `You earned $${formatMoney(earned)}`,
      earned,
      totalAmount,
      profit,
      setComplete,
      frozenBalanceAfter,
      balanceAfter,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to complete task' }, { status: 500 });
  }
}

function formatMoney(val) {
  const n = Number(val || 0);
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
