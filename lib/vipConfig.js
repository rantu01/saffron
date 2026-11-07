import clientPromise from "./mongodb";

const COLLECTION = "vipConfigVersions";

/**
 * Centralized, versioned VIP configuration.
 *
 * Each document is an immutable-ish version. Only one version is `published`
 * at a time (the active configuration). Values are supplied by the business;
 * this module does not seed or guess them.
 */
const DEFAULT_VIP_LEVELS = [
  { level: 1, unlockBalance: 0, name: "VIP 1", label: "Beginner", dailyGroupLimit: 3, profitIncrease: 0.5, tasksPerSet: 20 },
  { level: 2, unlockBalance: 1500, name: "VIP 2", label: "Advanced", dailyGroupLimit: 4, profitIncrease: 0.6, tasksPerSet: 25 },
  { level: 3, unlockBalance: 5000, name: "VIP 3", label: "Expert", dailyGroupLimit: 5, profitIncrease: 0.8, tasksPerSet: 35 },
  { level: 4, unlockBalance: 10000, name: "VIP 4", label: "Master", dailyGroupLimit: 6, profitIncrease: 1.0, tasksPerSet: 60 },
];

let seedPromise = null;
async function ensureDefaultVipConfig() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
      const existing = await db.collection(COLLECTION).findOne({ status: "published" });
      if (existing) return;
      const now = new Date();
      await db.collection(COLLECTION).insertOne({
        status: "published",
        levels: DEFAULT_VIP_LEVELS,
        effectiveFrom: now,
        createdBy: "system",
        note: "Seeded from approved VIP matrix",
        publishedAt: now,
        publishedBy: "system",
        createdAt: now,
        updatedAt: now,
      });
    } catch (e) {
      seedPromise = null;
    }
  })();
  return seedPromise;
}

export async function getActiveVipConfig() {
  await ensureDefaultVipConfig();
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const doc = await db.collection(COLLECTION).findOne({ status: "published" }, { sort: { effectiveFrom: -1, createdAt: -1 } });
  return doc || null;
}

export async function listVipConfigVersions({ page = 1, limit = 50 } = {}) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (safePage - 1) * safeLimit;
  const [versions, total] = await Promise.all([
    db.collection(COLLECTION).find({}).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    db.collection(COLLECTION).countDocuments({}),
  ]);
  return { versions, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}

export async function createVipConfigVersion({ levels, effectiveFrom = null, createdBy = null, note = "" }) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

  const now = new Date();
  const doc = {
    status: "draft",
    levels: Array.isArray(levels) ? levels : [],
    effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : now,
    createdBy: createdBy || null,
    note: note || "",
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function publishVipConfigVersion(id, { actorUid = null } = {}) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const { ObjectId } = await import("mongodb");

  const now = new Date();
  // Unpublish any currently published version.
  await db.collection(COLLECTION).updateMany({ status: "published" }, { $set: { status: "archived", updatedAt: now } });
  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status: "published", publishedAt: now, publishedBy: actorUid, updatedAt: now } },
    { returnDocument: "after" }
  );
  return result;
}
