import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getComboTaskAtPosition, getActiveComboTask } from "@/lib/comboTaskModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const setNumber = parseInt(searchParams.get("setNumber") || "1");
    const position = parseInt(searchParams.get("position") || "0");

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    let combo = null;

    if (position > 0) {
      combo = await getComboTaskAtPosition(uid, setNumber, position);
    } else {
      combo = await getActiveComboTask(uid, setNumber);
    }

    if (!combo) {
      return NextResponse.json({ success: true, combo: null });
    }

    const user = await (await clientPromise).db(process.env.MONGODB_DB_NAME || "saffron")
      .collection("users").findOne({ uid });

    const totalBalance = Number(user?.availableBalance || 0);
    const frozenBalance = Number(user?.frozenBalance || 0);
    const currentOrder = combo.orders[combo.currentOrderIndex];

    let additionalRequired = 0;
    if (currentOrder && currentOrder.status === "pending") {
      additionalRequired = Math.max(0, currentOrder.requiredAmount - frozenBalance);
    }

    const comboDebt = Number(user?.comboDebt || 0);

      return NextResponse.json({
        success: true,
        combo: {
          _id: combo._id,
          uid: combo.uid,
          setNumber: combo.setNumber,
          position: combo.position,
          status: combo.status,
          commissionPercent: combo.commissionPercent,
          totalRequiredAmount: combo.totalRequiredAmount,
          totalCommission: combo.totalCommission,
          currentOrderIndex: combo.currentOrderIndex,
          orders: combo.orders,
          fromTargetNegative: Boolean(combo.fromTargetNegative || false),
          totalBalance,
          frozenBalance,
          frozenAmount: Number(combo.frozenAmount || 0),
          balanceFrozen: Boolean(combo.balanceFrozen || false),
          comboDebt,
          additionalRequired,
          createdAt: combo.createdAt,
          updatedAt: combo.updatedAt,
        },
      });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load combo task" },
      { status: 500 }
    );
  }
}
