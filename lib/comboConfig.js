import clientPromise from "./mongodb";

const COLLECTION = "comboConfigVersions";

export async function getActiveComboConfigVersion() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  return db.collection(COLLECTION).findOne({ status: "published" }, { sort: { effectiveFrom: -1, createdAt: -1 } });
}

export async function listComboConfigVersions({ page = 1, limit = 50 } = {}) {
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

export async function createComboConfigVersion({ config, effectiveFrom = null, createdBy = null, note = "" }) {
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

export async function publishComboConfigVersion(id, { actorUid = null } = {}) {
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