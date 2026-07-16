import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

// Single source of truth for VIP tier thresholds (balance required to qualify)
// plus the per-tier task profit increase and tasks-per-set size.
export const VIP_LEVEL_THRESHOLDS = [
  { level: 1, unlockBalance: 0, name: "VIP 1", label: "Bronze", dailyProfit: 0.5, profitIncrease: 0.5, tasksPerSet: 20 },
  { level: 2, unlockBalance: 1500, name: "VIP 2", label: "Silver", dailyProfit: 2, profitIncrease: 2, tasksPerSet: 25 },
  { level: 3, unlockBalance: 5000, name: "VIP 3", label: "Gold", dailyProfit: 6, profitIncrease: 6, tasksPerSet: 30 },
  { level: 4, unlockBalance: 10000, name: "VIP 4", label: "Diamond", dailyProfit: 12, profitIncrease: 12, tasksPerSet: 40 },
];

// Returns the task configuration (profit increase % and tasks per set) for a
// given VIP level, defaulting to the base tier (VIP 1).
export function getVipTaskConfig(level) {
  const tier = getVipTier(level);
  return {
    profitIncrease: Number(tier.profitIncrease || 0),
    tasksPerSet: Number(tier.tasksPerSet || 20),
  };
}

export const MAX_VIP_LEVEL = VIP_LEVEL_THRESHOLDS.length;
export const DEFAULT_VIP_LEVEL = 1;

export function computeEligibleLevel(balance) {
  const bal = Number(balance || 0);
  let level = DEFAULT_VIP_LEVEL;
  for (const t of VIP_LEVEL_THRESHOLDS) {
    if (bal >= t.unlockBalance) level = t.level;
  }
  return level;
}

export function getVipTier(level) {
  return VIP_LEVEL_THRESHOLDS.find((t) => t.level === Number(level)) || VIP_LEVEL_THRESHOLDS[0];
}

async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

/**
 * Evaluates whether a user qualifies for a higher VIP level than they currently
 * hold. If they do, and we have not already raised a request for that level, a
 * pending VIP upgrade request (and an admin notification) is created. The user's
 * VIP level is NEVER changed here — only an admin approval does that.
 *
 * Idempotent: a pending request is only raised once per target level (tracked via
 * vipNotifiedLevel on the user doc).
 */
export async function evaluateVipEligibility(uid) {
  const db = await getDb();
  const user = await db.collection("users").findOne(
    { uid },
    { projection: { vipLevel: 1, vipNotifiedLevel: 1, availableBalance: 1, frozenBalance: 1, email: 1, displayName: 1 } }
  );
  if (!user) return null;

  const currentLevel = Number(user.vipLevel || DEFAULT_VIP_LEVEL);
  const notifiedLevel = Number(user.vipNotifiedLevel || DEFAULT_VIP_LEVEL);
  const balance = Number(user.availableBalance || 0) + Number(user.frozenBalance || 0);
  const eligibleLevel = computeEligibleLevel(balance);

  const result = { notified: false, eligibleLevel, currentLevel, requestId: null };

  if (eligibleLevel > currentLevel && eligibleLevel > notifiedLevel) {
    const request = {
      uid,
      email: user.email || "",
      displayName: user.displayName || user.email || "User",
      fromLevel: currentLevel,
      toLevel: eligibleLevel,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await db.collection("vipRequests").insertOne(request);

    await db.collection("users").updateOne(
      { uid },
      { $set: { vipNotifiedLevel: eligibleLevel, updatedAt: new Date() } }
    );

    await db.collection("notifications").insertOne({
      recipient: "admin",
      type: "vip_upgrade_request",
      title: "VIP Upgrade Eligibility",
      message: `User ${request.displayName} (UID: ${uid}) has reached the requirements for VIP Level ${eligibleLevel}.`,
      isRead: false,
      metadata: { requestId: String(res.insertedId), uid, toLevel: eligibleLevel, fromLevel: currentLevel },
      createdAt: new Date(),
    }).catch(() => {});

    result.notified = true;
    result.requestId = String(res.insertedId);
  }

  return result;
}

export async function getPendingVipRequestCount() {
  const db = await getDb();
  return db.collection("vipRequests").countDocuments({ status: "pending" });
}

async function buildGroupQuery(db, search) {
  const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  const or = [
    { email: regex },
    { displayName: regex },
    { username: regex },
    { uid: regex },
  ];
  const matchingGroups = await db
    .collection("taskGroups")
    .find({ name: regex })
    .project({ _id: 1 })
    .toArray();
  if (matchingGroups.length) {
    const groupIds = matchingGroups.map((g) => g._id.toString());
    const groupUids = await db
      .collection("tasks")
      .distinct("assigneeUid", { parentTaskGroupId: { $in: groupIds } });
    if (groupUids.length) or.push({ uid: { $in: groupUids } });
  }
  return or;
}

export async function getVipRequests({ search = "", page = 1, limit = 10, status = "pending" } = {}) {
  const db = await getDb();
  const query = {};
  if (status && status !== "all") query.status = status;
  if (search) query.$or = await buildGroupQuery(db, search);

  const adminUids = await db.collection("users").distinct("uid", { role: "admin" });
  if (adminUids.length) query.uid = { $nin: adminUids };

  const skip = (Math.max(1, page) - 1) * limit;
  const [requests, total] = await Promise.all([
    db.collection("vipRequests").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.collection("vipRequests").countDocuments(query),
  ]);

  return {
    requests: requests.map((r) => ({ ...r, _id: String(r._id) })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getVipUsers({ search = "", page = 1, limit = 20 } = {}) {
  const db = await getDb();
  const query = { role: { $ne: "admin" } };
  if (search) query.$or = await buildGroupQuery(db, search);

  const skip = (Math.max(1, page) - 1) * limit;
  const [users, total] = await Promise.all([
    db
      .collection("users")
      .find(query)
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("users").countDocuments(query),
  ]);

  const uids = users.map((u) => u.uid);
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
    const groups = await db.collection("taskGroups").find({}).project({ name: 1 }).toArray();
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

  const result = users.map((u) => {
    const availableBalance = Number(u.availableBalance || 0);
    const frozenBalance = Number(u.frozenBalance || 0);
    const balance = availableBalance + frozenBalance;
    const vipLevel = Number(u.vipLevel || DEFAULT_VIP_LEVEL);
    const eligibleLevel = computeEligibleLevel(balance);
    return {
      uid: u.uid,
      email: u.email || "",
      displayName: u.displayName || "",
      username: u.username || "",
      accountType: u.accountType || "main",
      accountStatus: u.accountStatus || "active",
      availableBalance,
      frozenBalance,
      balance,
      vipLevel,
      eligibleLevel,
      status: vipLevel >= eligibleLevel ? "unlocked" : "locked",
      currentGroup: groupByUid[u.uid] || null,
    };
  });

  return { users: result, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function approveVipRequest(requestId, { adminUid = "", note = "" } = {}) {
  const db = await getDb();
  if (!ObjectId.isValid(requestId)) throw new Error("Invalid request id");
  const req = await db.collection("vipRequests").findOne({ _id: new ObjectId(requestId) });
  if (!req) throw new Error("Request not found");
  if (req.status !== "pending") throw new Error("Request already resolved");

  await db.collection("vipRequests").updateOne(
    { _id: req._id },
    { $set: { status: "approved", resolvedAt: new Date(), resolvedBy: adminUid, adminNote: note, updatedAt: new Date() } }
  );
  const taskConfig = getVipTaskConfig(req.toLevel);
  await db.collection("users").updateOne(
    { uid: req.uid },
    {
      $set: {
        vipLevel: req.toLevel,
        vipNotifiedLevel: Math.max(req.toLevel, Number(req.fromLevel || 1)),
        vipProfitIncrease: taskConfig.profitIncrease,
        vipTasksPerSet: taskConfig.tasksPerSet,
        updatedAt: new Date(),
      },
    }
  );

  await db.collection("notifications").insertOne({
    recipient: req.uid,
    type: "vip_upgrade_approved",
    title: "VIP Upgrade Approved",
    message: `Congratulations! Your VIP Level ${req.toLevel} (${getVipTier(req.toLevel).label}) has been approved.`,
    isRead: false,
    metadata: { fromLevel: req.fromLevel, toLevel: req.toLevel },
    createdAt: new Date(),
  }).catch(() => {});

  return { ...req, _id: String(req._id), status: "approved" };
}

export async function rejectVipRequest(requestId, { adminUid = "", note = "" } = {}) {
  const db = await getDb();
  if (!ObjectId.isValid(requestId)) throw new Error("Invalid request id");
  const req = await db.collection("vipRequests").findOne({ _id: new ObjectId(requestId) });
  if (!req) throw new Error("Request not found");
  if (req.status !== "pending") throw new Error("Request already resolved");

  await db.collection("vipRequests").updateOne(
    { _id: req._id },
    { $set: { status: "rejected", resolvedAt: new Date(), resolvedBy: adminUid, adminNote: note, updatedAt: new Date() } }
  );
  // vipNotifiedLevel is left unchanged so we don't re-notify for the same level
  // until the user qualifies for an even higher level.
  return { ...req, _id: String(req._id), status: "rejected" };
}

export async function setUserVipLevel(uid, level, { adminUid = "", action = "set", note = "" } = {}) {
  const db = await getDb();
  const target = Math.min(MAX_VIP_LEVEL, Math.max(DEFAULT_VIP_LEVEL, Number(level)));
  const user = await db.collection("users").findOne({ uid }, { projection: { vipLevel: 1, email: 1, displayName: 1 } });
  if (!user) throw new Error("User not found");
  const fromLevel = Number(user.vipLevel || DEFAULT_VIP_LEVEL);

  const taskConfig = getVipTaskConfig(target);
  await db.collection("users").updateOne(
    { uid },
    {
      $set: {
        vipLevel: target,
        vipNotifiedLevel: target,
        vipProfitIncrease: taskConfig.profitIncrease,
        vipTasksPerSet: taskConfig.tasksPerSet,
        updatedAt: new Date(),
      },
    }
  );

  await db.collection("vipRequests").insertOne({
    uid,
    email: user.email || "",
    displayName: user.displayName || user.email || "User",
    fromLevel,
    toLevel: target,
    status: "manual",
    action,
    resolvedBy: adminUid,
    adminNote: note,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { uid, vipLevel: target, fromLevel };
}
