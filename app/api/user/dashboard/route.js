import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getActiveComboTask } from "@/lib/comboTaskModel";
import { evaluateVipEligibility } from "@/lib/vipModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const user = await db.collection("users").findOne({ uid });

    // Raise a pending VIP upgrade request if the user now qualifies for a higher
    // level (admin approval still required; the level is never auto-unlocked).
    await evaluateVipEligibility(uid).catch(() => {});

    const tasks = await db
      .collection("tasks")
      .find({ assigneeUid: uid })
      .sort({ createdAt: -1 })
      .toArray();

    const latestSet = await db
      .collection("userTaskSets")
      .find({ uid })
      .sort({ setNumber: -1 })
      .limit(1)
      .toArray();

    const currentSetNumber = latestSet.length > 0 ? latestSet[0].setNumber : 1;
    let activeCombo = await getActiveComboTask(uid, currentSetNumber);
    if (activeCombo) {
      const { _id, ...comboData } = activeCombo;
      activeCombo = { _id: String(_id), ...comboData };
    }

    return NextResponse.json({
      success: true,
      dashboard: {
        availableBalance: Number(user?.availableBalance || 0),
        frozenBalance: Number(user?.frozenBalance || 0),
        comboDebt: Number(user?.comboDebt || 0),
        totalEarned: user?.totalEarned || 0,
        totalEarnedNet: Math.max(0, Number(user?.totalEarned || 0) - Number(user?.comboDebt || 0)),
        usdRate: 129,
        role: user?.role || "user",
        accountStatus: user?.accountStatus || "active",
        accountType: user?.accountType || (user?.isDemoAccount ? "demo" : "main"),
        isDemoAccount: Boolean(user?.isDemoAccount || user?.accountType === "demo"),
        inviterUid: user?.inviterUid || "",
        inviterEmail: user?.inviterEmail || "",
        freezeReason: user?.freezeReason || null,
        freezeThreshold: Number(user?.freezeThreshold || 0),
        demoProfitSharePercent: Number(user?.demoProfitSharePercent || 20),
        comboStage: user?.comboStage || 0,
        vipLevel: Number(user?.vipLevel || 1),
        vipNotifiedLevel: Number(user?.vipNotifiedLevel || 1),
        tasks,
        activeComboTask: activeCombo || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load dashboard." },
      { status: 500 }
    );
  }
}