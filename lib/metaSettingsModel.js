import clientPromise from "./mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

export async function getMetaSettings() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("metaSettings").findOne({ _id: "global" });
}

export async function updateMetaSettings(updates) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const { _id, ...data } = updates;
  await db.collection("metaSettings").updateOne(
    { _id: "global" },
    { $set: { ...data, updatedAt: new Date() } },
    { upsert: true }
  );
  return getMetaSettings();
}

export async function saveMetaAdAccounts(accounts) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection("metaAdAccounts").deleteMany({});
  if (accounts.length > 0) {
    const docs = accounts.map((a) => ({
      ...a,
      importedAt: new Date(),
    }));
    await db.collection("metaAdAccounts").insertMany(docs);
  }
}

export async function getMetaAdAccounts() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("metaAdAccounts").find().sort({ name: 1 }).toArray();
}

export async function createSyncLog(entry) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection("syncLogs").insertOne({ ...entry, createdAt: new Date() });
}

export async function getSyncLogs(limit = 50) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("syncLogs").find().sort({ createdAt: -1 }).limit(limit).toArray();
}
