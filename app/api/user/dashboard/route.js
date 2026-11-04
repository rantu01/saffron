import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getActiveComboTask, activateComboFreeze } from "@/lib/comboTaskModel";
import { evaluateVipEligibility } from "@/lib/vipModel";
import { normalizeRole } from "@/lib/roles";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const user = await db.collection("users").findOne({
      $or: [{ uid }, { authUid: uid }, ...(email ? [{ email }] : [])],
    });
    const userUid = user?.uid || uid;

    // Raise a pending VIP upgrade request if the user now qualifies for a higher
    // level (admin approval still required; the level is never auto-unlocked).
    await evaluateVipEligibility(userUid).catch(() => {});

    const tasks = await db
      .collection("tasks")
      .find({ assigneeUid: userUid })
      .sort({ createdAt: -1 })
      .toArray();

    const latestSet = await db
      .collection("userTaskSets")
      .find({ uid: userUid })
      .sort({ setNumber: -1 })
      .limit(1)
      .toArray();

    const currentSetNumber = latestSet.length > 0 ? latestSet[0].setNumber : 1;
    const currentSetProgress = latestSet.length > 0 ? latestSet[0] : null;
    const currentPosition = currentSetProgress ? Number(currentSetProgress.currentPosition || 0) : 0;

    let activeCombo = await getActiveComboTask(userUid, currentSetNumber);
    if (activeCombo) {
      // Drive the balance negative only when the combo has reached its position.
      const activated = await activateComboFreeze(db, userUid, activeCombo, currentPosition);
      if (activated) {
        // Reload the user + combo so the returned balances reflect the new freeze.
        const refreshed = await db.collection("users").findOne({ uid: userUid });
        if (refreshed) {
          user.availableBalance = refreshed.availableBalance;
          user.frozenBalance = refreshed.frozenBalance;
        }
        activeCombo = await getActiveComboTask(userUid, currentSetNumber);
      }
      const { _id, ...comboData } = activeCombo;
      activeCombo = { _id: String(_id), ...comboData };
    }

    return NextResponse.json({
      success: true,
      dashboard: {
        availableBalance: Number(user?.availableBalance || 0),
        frozenBalance: Number(user?.frozenBalance || 0),
        comboDebt: Number(user?.comboDebt || 0),
        firstTaskStarted: Boolean(user?.firstTaskStarted || false),
        totalEarned: user?.totalEarned || 0,
        totalEarnedNet: Math.max(0, Number(user?.totalEarned || 0) - Number(user?.comboDebt || 0)),
        usdRate: 129,
        role: normalizeRole(user?.role),
        accountStatus: user?.accountStatus || "active",
        accountType: user?.accountType || (user?.isDemoAccount ? "demo" : "main"),
        isDemoAccount: Boolean(user?.isDemoAccount || user?.accountType === "demo"),
        walletAddress: user?.walletAddress || "",
        walletNetwork: user?.walletNetwork || "",
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