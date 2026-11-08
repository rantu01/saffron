import clientPromise from "./mongodb";

const COLLECTION = "withdrawalConfigVersions";
const DEFAULTS = {
  minAmount: 10,
  maxAmount: 100000,
  dailyRequestLimit: 5,
  feePercent: 0,
  processingTime: "24-48 hours",
};

let seedPromise = null;
async function ensureDefault() {
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
        config: { ...DEFAULTS },
        effectiveFrom: now,
        createdBy: "system",
        note: "Platform default withdrawal rules (configurable by admin)",
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

export async function getActiveWithdrawalConfig() {
  await ensureDefault();
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const doc = await db.collection(COLLECTION).findOne(
    { status: "published" },
    { sort: { effectiveFrom: -1, createdAt: -1 } }
  );
  return (doc && doc.config) ? { ...DEFAULTS, ...doc.config } : { ...DEFAULTS };
}

export async function listWithdrawalConfigVersions({ page = 1, limit = 50 } = {}) {
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

export async function createWithdrawalConfigVersion({ config, effectiveFrom = null, createdBy = null, note = "" }) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const now = new Date();
  const doc = {
    status: "draft",
    config: config || {},
    effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : now,
    createdBy: createdBy || null,
    note: note || "",
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection(COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function publishWithdrawalConfigVersion(id, { actorUid = null } = {}) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const { ObjectId } = await import("mongodb");
  const now = new Date();
  await db.collection(COLLECTION).updateMany({ status: "published" }, { $set: { status: "archived", updatedAt: now } });
  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status: "published", publishedAt: now, publishedBy: actorUid, updatedAt: now } },
    { returnDocument: "after" }
  );
  return result;
}