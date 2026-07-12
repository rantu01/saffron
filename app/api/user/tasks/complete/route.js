import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { creditUserBalance, getUserByUid } from "@/lib/userModel";
import { createBalanceLog } from "@/lib/balanceLog";
import { roundCurrency } from "@/lib/taskModel";
import { getActiveComboTask, NORMAL_COMMISSION_RATE } from "@/lib/comboTaskModel";

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
    const earned = roundCurrency(totalAmount + profit);

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

    const balanceBefore = Number(user.availableBalance || 0);
    await creditUserBalance(uid, earned, { autoResolveFreeze: true });
    const userAfterTask = await getUserByUid(uid);
    const balanceAfter = Number(userAfterTask?.availableBalance || 0);

    await createBalanceLog({
      uid,
      email: user?.email || "",
      type: "task_earnings",
      amount: earned,
      balanceBefore,
      balanceAfter,
      description: `Task completed: ${task.appName || task.title || "Task"} (total $${totalAmount} + profit $${profit})`,
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

    return NextResponse.json({
      success: true,
      message: `You earned $${formatMoney(earned)}`,
      earned,
      totalAmount,
      profit,
      setComplete,
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
