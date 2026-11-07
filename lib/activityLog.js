import clientPromise from "./mongodb";

/**
 * Append-only administrative activity log.
 *
 * Records are never updated or deleted through this module. Each entry stores
 * an actor snapshot so the record survives deletion of the actor or target.
 */
export async function createActivityLog({
  actorUid = null,
  actorEmail = "",
  actorRole = "",
  action,
  targetType = "",
  targetId = null,
  targetSnapshot = null,
  before = null,
  after = null,
  reason = "",
  metadata = {},
  ip = "",
  userAgent = "",
}) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

  const entry = {
    actorUid: actorUid || null,
    actorEmail: actorEmail || "",
    actorRole: actorRole || "",
    action: String(action || "").trim(),
    targetType: targetType || "",
    targetId: targetId == null ? null : String(targetId),
    targetSnapshot: targetSnapshot || null,
    before: before == null ? null : before,
    after: after == null ? null : after,
    reason: reason || "",
    metadata: metadata || {},
    ip: ip || "",
    userAgent: userAgent || "",
    createdAt: new Date(),
  };

  const result = await db.collection("activityLogs").insertOne(entry);
  return { ...entry, _id: result.insertedId };
}

export async function getActivityLogs({
  actorUid = null,
  action = null,
  targetType = null,
  targetId = null,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 50,
} = {}) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

  const query = {};
  if (actorUid) query.actorUid = actorUid;
  if (action) query.action = action;
  if (targetType) query.targetType = targetType;
  if (targetId) query.targetId = String(targetId);
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (safePage - 1) * safeLimit;

  const [logs, total] = await Promise.all([
    db.collection("activityLogs").find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    db.collection("activityLogs").countDocuments(query),
  ]);

  return { logs, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}
