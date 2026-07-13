import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { debitUserBalance, getUserByUid } from "@/lib/userModel";
import { createBalanceLog } from "@/lib/balanceLog";
import { getActiveComboTask } from "@/lib/comboTaskModel";

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { taskId, uid, mode } = body;

    if (!taskId || !uid) {
      return NextResponse.json({ success: false, message: "taskId and uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const task = await db.collection("tasks").findOne({ _id: typeof taskId === "string" ? new ObjectId(taskId) : taskId });

    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    if (task.assigneeUid !== uid) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    if (task.status !== "pending") {
      return NextResponse.json({ success: false, message: "Task is not in pending status." }, { status: 400 });
    }

    if (task.isComboTask && task.taskType === "combo") {
      return NextResponse.json({
        success: false,
        message: "Cannot cancel a Combined Task. Complete all linked orders instead.",
      }, { status: 400 });
    }

    const activeCombo = await getActiveComboTask(uid, task.setNumber || 1);
    if (activeCombo && activeCombo.status !== "pending") {
      return NextResponse.json({
        success: false,
        message: "A Combined Task is in progress. Complete it before cancelling other tasks.",
        comboStatus: activeCombo.status,
      }, { status: 400 });
    }

    const totalAmount = Number(task.totalAmount || 0);

    // Freeze mode (default): the task amount is moved to Frozen Balance instead
    // of being permanently deducted. The task stays "pending" so it can be
    // completed/submitted later. The task set position is NOT advanced.
    const freezeMode = mode !== "cancel";

    if (totalAmount <= 0) {
      return NextResponse.json({
        success: true,
        message: "No amount to hold for this task.",
        frozenAmount: 0,
        balanceAfter: Number(task.frozenAmount || 0),
        frozenBalance: Number((await getUserByUid(uid))?.frozenBalance || 0),
      });
    }

    const user = await getUserByUid(uid);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const balanceBefore = Number(user.availableBalance || 0);
    const frozenBefore = Number(user.frozenBalance || 0);

    if (freezeMode) {
      await db.collection("users").updateOne(
        { uid },
        {
          $inc: {
            availableBalance: -totalAmount,
            frozenBalance: totalAmount,
          },
          $set: { firstTaskStarted: true, updatedAt: new Date() },
        }
      );

      await db.collection("tasks").updateOne(
        { _id: task._id },
        {
          $set: {
            frozenAmount: totalAmount,
            startedWithoutSubmit: true,
            status: "pending",
            updatedAt: new Date(),
          },
        }
      );

      const balanceAfter = round2(balanceBefore - totalAmount);
      const frozenBalance = round2(frozenBefore + totalAmount);

      await createBalanceLog({
        uid,
        email: user.email || "",
        type: "task_frozen",
        amount: -totalAmount,
        balanceBefore,
        balanceAfter,
        description: `Task held (not submitted): ${task.appName || task.title || "Task"} ($${totalAmount} moved to Frozen Balance)`,
        referenceId: String(task._id),
        referenceType: "task_frozen",
        metadata: { taskId: String(task._id), appName: task.appName, frozenAmount: totalAmount },
      });

      return NextResponse.json({
        success: true,
        message: `$${totalAmount} moved to your Frozen Balance. Submit this task later from Pending Tasks.`,
        frozenAmount: totalAmount,
        balanceAfter,
        frozenBalance,
        frozen: true,
      });
    }

    // Permanent deduction mode (legacy).
    await db.collection("tasks").updateOne(
      { _id: task._id },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = await debitUserBalance(uid, totalAmount, { autoResolveFreeze: false });
    const balanceAfter = Number(updatedUser?.availableBalance || 0);

    await createBalanceLog({
      uid,
      email: user.email || "",
      type: "task_cancellation",
      amount: -totalAmount,
      balanceBefore,
      balanceAfter,
      description: `Task cancelled: ${task.appName || task.title || "Task"} (amount deducted)`,
      referenceId: String(task._id),
      referenceType: "task_cancellation",
      metadata: { taskId: String(task._id), appName: task.appName },
    });

    return NextResponse.json({
      success: true,
      message: `$${totalAmount} deducted from your account.`,
      deductedAmount: totalAmount,
      balanceAfter,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to cancel task." },
      { status: 500 }
    );
  }
}
