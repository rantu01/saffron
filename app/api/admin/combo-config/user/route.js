import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import {
  getComboConfig,
  getUserComboSettings,
  saveUserComboSettings,
  deleteUserComboSettings,
} from "@/lib/comboTaskModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const user = await db.collection("users").findOne({ uid }, { projection: { password: 0 } });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const config = await getComboConfig();

    // Task set progress
    const taskSets = await db
      .collection("userTaskSets")
      .find({ uid })
      .sort({ setNumber: -1 })
      .toArray();
    const currentSet = taskSets[0] || null;

    // Groups this user is/was assigned to (distinct parentTaskGroupId)
    const assignedGroupIds = await db
      .collection("tasks")
      .distinct("parentTaskGroupId", { assigneeUid: uid, parentTaskGroupId: { $ne: null } });

    const groups = await db
      .collection("taskGroups")
      .find({})
      .project({ name: 1, description: 1 })
      .toArray();
    const groupNameById = {};
    for (const g of groups) groupNameById[g._id.toString()] = g.name;

    // Current group = group of the latest set's tasks
    let currentGroup = null;
    const latestTask = await db
      .collection("tasks")
      .find({ assigneeUid: uid, parentTaskGroupId: { $ne: null } })
      .sort({ setNumber: -1, createdAt: -1 })
      .limit(1)
      .toArray();
    if (latestTask[0]) {
      currentGroup = {
        groupId: latestTask[0].parentTaskGroupId,
        groupName: groupNameById[latestTask[0].parentTaskGroupId] || "—",
        setNumber: latestTask[0].setNumber,
      };
    }

    // Task counts by status for current set
    const taskStats = await db
      .collection("tasks")
      .aggregate([
        { $match: { assigneeUid: uid, isComboTask: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray();
    const statusCounts = {};
    for (const s of taskStats) statusCounts[s._id] = s.count;

    // Combo task history / active combo
    const comboTasks = await db
      .collection("comboTasks")
      .find({ uid })
      .sort({ createdAt: -1 })
      .toArray();
    const activeCombo = comboTasks.find((c) =>
      ["pending", "in_progress", "waiting_balance"].includes(c.status)
    ) || null;

    const settings = getUserComboSettings(config, uid);

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        username: user.username || "",
        accountType: user.accountType || "main",
        accountStatus: user.accountStatus || "active",
        availableBalance: Number(user.availableBalance || 0),
        frozenBalance: Number(user.frozenBalance || 0),
        comboStage: Number(user.comboStage || 0),
        comboDebt: Number(user.comboDebt || 0),
      },
      currentGroup,
      assignedGroups: assignedGroupIds.map((id) => ({
        groupId: id,
        groupName: groupNameById[id] || "—",
      })),
      currentSet,
      statusCounts,
      activeCombo: activeCombo
        ? {
            _id: String(activeCombo._id),
            status: activeCombo.status,
            position: activeCombo.position,
            setNumber: activeCombo.setNumber,
            currentOrderIndex: activeCombo.currentOrderIndex,
            totalRequiredAmount: activeCombo.totalRequiredAmount,
            totalCommission: activeCombo.totalCommission,
            commissionPercent: activeCombo.commissionPercent,
            orders: activeCombo.orders,
          }
        : null,
      comboHistoryCount: comboTasks.length,
      settings,
      defaults: {
        enabled: config.enabled,
        commissionPercent: config.commissionPercent,
        minOrders: config.minOrders,
        maxOrders: config.maxOrders,
        positions: config.positions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load user combo details" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, settings } = body;
    if (!uid || !settings) {
      return NextResponse.json({ success: false, message: "uid and settings required" }, { status: 400 });
    }

    const saved = await saveUserComboSettings(uid, settings);

    return NextResponse.json({
      success: true,
      message: "Per-user combo settings saved.",
      settings: saved,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save user combo settings" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    await deleteUserComboSettings(uid);

    return NextResponse.json({ success: true, message: "Per-user combo settings removed." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to remove user combo settings" },
      { status: 500 }
    );
  }
}
