import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { completeComboOrder, creditComboCommission } from "@/lib/comboTaskModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { comboId, uid } = body;

    if (!comboId || !uid) {
      return NextResponse.json({ success: false, message: "comboId and uid required" }, { status: 400 });
    }

    const result = await completeComboOrder(comboId, uid);

    if (!result.success) {
      if (result.insufficientBalance) {
        return NextResponse.json({
          success: false,
          insufficientBalance: true,
          message: result.message,
          requiredAmount: result.requiredAmount,
          currentBalance: result.currentBalance,
          additionalRequired: result.additionalRequired,
          status: "waiting_balance",
        }, { status: 200 });
      }
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    if (result.allComplete) {
      const creditResult = await creditComboCommission(comboId, uid);

      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

      const combo = await db.collection("comboTasks").findOne({ _id: new ObjectId(comboId) });

      if (combo) {
        const taskEntry = await db.collection("tasks").findOne({
          assigneeUid: uid,
          setNumber: combo.setNumber,
          position: combo.position,
          isComboTask: true,
        });

        if (taskEntry && taskEntry.status !== "completed") {
          await db.collection("tasks").updateOne(
            { _id: taskEntry._id },
            {
              $set: {
                status: "completed",
                completedAt: new Date(),
                earnedAmount: creditResult?.amount || 0,
                updatedAt: new Date(),
              },
            }
          );

          await db.collection("userTaskSets").findOneAndUpdate(
            { uid, setNumber: combo.setNumber },
            { $inc: { completedTasks: 1, currentPosition: 1 }, $set: { updatedAt: new Date() } },
            { returnDocument: "after" }
          );
        }
      }

      return NextResponse.json({
        success: true,
        allComplete: true,
        message: result.message,
        commission: result.commission,
        orderCompleted: result.orderCompleted,
        creditResult,
      });
    }

    return NextResponse.json({
      success: true,
      allComplete: false,
      message: result.message,
      orderCompleted: result.orderCompleted,
      nextOrder: result.nextOrder,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to complete order" },
      { status: 500 }
    );
  }
}
