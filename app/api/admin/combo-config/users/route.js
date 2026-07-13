import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getComboConfig } from "@/lib/comboTaskModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    let query = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      // Find task groups whose name matches, then the users assigned to them.
      const matchingGroups = await db
        .collection("taskGroups")
        .find({ name: regex })
        .project({ _id: 1 })
        .toArray();

      let groupUids = [];
      if (matchingGroups.length) {
        const groupIds = matchingGroups.map((g) => g._id.toString());
        groupUids = await db
          .collection("tasks")
          .distinct("assigneeUid", { parentTaskGroupId: { $in: groupIds } });
      }

      const or = [
        { email: regex },
        { displayName: regex },
        { username: regex },
        { uid: regex },
      ];
      if (groupUids.length) {
        or.push({ uid: { $in: groupUids } });
      }
      query = { $or: or };
    }

    const [users, total, config] = await Promise.all([
      db
        .collection("users")
        .find(query)
        .project({ password: 0 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      db.collection("users").countDocuments(query),
      getComboConfig(),
    ]);

    const uids = users.map((u) => u.uid);

    // Resolve each user's current (latest) task group name.
    const groupByUid = {};
    if (uids.length) {
      const latestTasks = await db
        .collection("tasks")
        .aggregate([
          { $match: { assigneeUid: { $in: uids }, parentTaskGroupId: { $ne: null } } },
          { $sort: { setNumber: -1, createdAt: -1 } },
          {
            $group: {
              _id: "$assigneeUid",
              parentTaskGroupId: { $first: "$parentTaskGroupId" },
              setNumber: { $first: "$setNumber" },
            },
          },
        ])
        .toArray();

      const groupIds = [...new Set(latestTasks.map((t) => t.parentTaskGroupId).filter(Boolean))];
      const groups = await db
        .collection("taskGroups")
        .find({})
        .project({ name: 1 })
        .toArray();
      const groupNameById = {};
      for (const g of groups) groupNameById[g._id.toString()] = g.name;

      for (const t of latestTasks) {
        groupByUid[t._id] = {
          groupId: t.parentTaskGroupId,
          groupName: groupNameById[t.parentTaskGroupId] || "—",
          setNumber: t.setNumber,
        };
      }
    }

    // Which users currently have an active combo task.
    const activeComboUids = uids.length
      ? await db.collection("comboTasks").distinct("uid", {
          uid: { $in: uids },
          status: { $in: ["pending", "in_progress", "waiting_balance"] },
        })
      : [];
    const activeSet = new Set(activeComboUids);

    const userComboSettings = config.userComboSettings || {};

    const result = users.map((u) => ({
      uid: u.uid,
      email: u.email || "",
      displayName: u.displayName || "",
      username: u.username || "",
      accountType: u.accountType || "main",
      accountStatus: u.accountStatus || "active",
      availableBalance: Number(u.availableBalance || 0),
      frozenBalance: Number(u.frozenBalance || 0),
      comboStage: Number(u.comboStage || 0),
      currentGroup: groupByUid[u.uid] || null,
      hasActiveCombo: activeSet.has(u.uid),
      comboSettings: userComboSettings[u.uid] || null,
    }));

    return NextResponse.json({
      success: true,
      users: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch users." },
      { status: 500 }
    );
  }
}
