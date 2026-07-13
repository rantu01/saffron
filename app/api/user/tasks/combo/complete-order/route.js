import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { completeComboOrder, creditComboCommission } from "@/lib/comboTaskModel";
import { getDailyLimitStatus, markSetCompletedToday } from "@/lib/taskSetModel";
import { evaluateVipEligibility } from "@/lib/vipModel";

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
        // Check VIP eligibility (creates a pending admin request if qualified).
        await evaluateVipEligibility(uid).catch(() => {});

        const taskEntry = await db.collection("tasks").findOne({
          assigneeUid: uid,
          setNumber: combo.setNumber,
          position: combo.position,
          isComboTask: true,
        });

        if (taskEntry && taskEntry.status !== "completed") {
          // Enforce the daily set limit before counting this set as complete.
          const dailyLimit = await getDailyLimitStatus(uid);
          if (dailyLimit.reached) {
            return NextResponse.json({
              success: false,
              dailyLimitReached: true,
              message: "Try again in 24 hours.",
            }, { status: 400 });
          }

          // A combo with N orders advances the user past every position it
          // occupies (combo.position .. combo.position + N - 1) instead of a
          // single position, so the next available task follows the combo.
          const orderCount = Array.isArray(combo.orders) ? combo.orders.length : 1;
          const comboPosition = Number(combo.position || 0);
          const advanceTo = comboPosition + orderCount;

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

          // Mark any normal tasks absorbed by the combo's order span as completed
          // so the set can still reach its total and progress doesn't deadlock.
          await db.collection("tasks").updateMany(
            {
              assigneeUid: uid,
              setNumber: combo.setNumber,
              position: { $gt: comboPosition, $lte: advanceTo },
              isComboTask: { $ne: true },
              status: { $ne: "completed" },
            },
            {
              $set: { status: "completed", completedAt: new Date(), updatedAt: new Date() },
            }
          );

          const updatedSet = await db.collection("userTaskSets").findOneAndUpdate(
            { uid, setNumber: combo.setNumber },
            {
              $max: { completedTasks: advanceTo, currentPosition: advanceTo },
              $set: { updatedAt: new Date() },
            },
            { returnDocument: "after" }
          );

          if (updatedSet?.value && (updatedSet.value.completedTasks || 0) >= (updatedSet.value.totalTasks || 30)) {
            await markSetCompletedToday(uid, combo.setNumber);
          }
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
