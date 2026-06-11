import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { debitUserBalance, getUserByUid } from "@/lib/userModel";
import { createBalanceLog } from "@/lib/balanceLog";

export async function POST(request) {
  try {
    const body = await request.json();
    const { taskId, uid } = body;

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

    const totalAmount = Number(task.totalAmount || 0);
    if (totalAmount <= 0) {
      return NextResponse.json({ success: false, message: "No amount to deduct for this task." }, { status: 400 });
    }

    const user = await getUserByUid(uid);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const balanceBefore = Number(user.availableBalance || 0);

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
