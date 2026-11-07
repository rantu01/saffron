import clientPromise from "./mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

export async function getWhatsAppSettings() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("whatsappSettings").findOne({ _id: "global" });
}

export async function updateWhatsAppSettings(updates) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const { _id, ...data } = updates;
  await db.collection("whatsappSettings").updateOne(
    { _id: "global" },
    { $set: { ...data, updatedAt: new Date() } },
    { upsert: true }
  );
  return getWhatsAppSettings();
}

export async function logNotification(entry) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection("notificationLogs").insertOne({ ...entry, createdAt: new Date() });
}

export async function getNotificationLogs(limit = 100, page = 1) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 100));
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * safeLimit;
  const [logs, total] = await Promise.all([
    db.collection("notificationLogs").find().sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    db.collection("notificationLogs").countDocuments(),
  ]);
  return { logs, total, page: safePage, limit: safeLimit };
}

export async function getNotificationLogsByUid(uid, limit = 50) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("notificationLogs").find({ uid }).sort({ createdAt: -1 }).limit(limit).toArray();
}
