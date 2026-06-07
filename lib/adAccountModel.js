import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

export async function getAdAccountsByUid(uid) {
  if (!uid) return [];
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("adAccounts").find({ uid, unassignedAt: null }).sort({ createdAt: -1 }).toArray();
}

export async function getAllAdAccounts(includeUnassigned = false) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const filter = includeUnassigned ? {} : { unassignedAt: null };
  return db.collection("adAccounts").find(filter).sort({ createdAt: -1 }).toArray();
}

export async function getUnassignedAdAccounts() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("adAccounts").find({ uid: { $in: [null, ""] }, unassignedAt: null }).sort({ createdAt: -1 }).toArray();
}

export async function getAdAccountByMetaId(metaAccountId) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("adAccounts").findOne({ metaAccountId });
}

export async function createAdAccount({ uid, email, name, accountId, budget, status = "active", metaAccountId, metaAccountName, currency, spendCap, assignedBy }) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const doc = {
    uid: uid || "",
    email: email || "",
    name: name || `Ad Account ${Date.now()}`,
    accountId: accountId || `AD_${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    metaAccountId: metaAccountId || "",
    metaAccountName: metaAccountName || "",
    currency: currency || "USD",
    spendCap: Number(spendCap || 0),
    status,
    budget: Number(budget || 0),
    spent: 0,
    assignedBy: assignedBy || null,
    assignedAt: uid ? new Date() : null,
    unassignedAt: null,
    lastSyncedAt: null,
    syncStatus: "pending",
    syncError: null,
    lastInsights: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("adAccounts").insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateAdAccount(accountId, updates) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const setFields = { ...updates, updatedAt: new Date() };
  delete setFields._id;

  const result = await db.collection("adAccounts").findOneAndUpdate(
    { _id: new ObjectId(accountId) },
    { $set: setFields },
    { returnDocument: "after" }
  );

  return result.value;
}

export async function assignAdAccount(accountId, uid, email, assignedBy) {
  return updateAdAccount(accountId, {
    uid,
    email: email || "",
    assignedBy,
    assignedAt: new Date(),
    unassignedAt: null,
  });
}

export async function unassignAdAccount(accountId) {
  return updateAdAccount(accountId, {
    uid: "",
    email: "",
    assignedBy: null,
    unassignedAt: new Date(),
  });
}

export async function deleteAdAccount(accountId) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection("adAccounts").deleteOne({ _id: new ObjectId(accountId) });
}
