import clientPromise from "./mongodb";

export async function createBalanceLog({ uid, email, type, amount, balanceBefore, balanceAfter, description, referenceId, referenceType, metadata = {} }) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

  const log = {
    uid,
    email: email || "",
    type,
    amount: Number(amount || 0),
    balanceBefore: Number(balanceBefore || 0),
    balanceAfter: Number(balanceAfter || 0),
    description: description || "",
    referenceId: referenceId || null,
    referenceType: referenceType || null,
    metadata,
    createdAt: new Date(),
  };

  const result = await db.collection("balanceLogs").insertOne(log);
  return { ...log, _id: result.insertedId };
}

export async function getBalanceLogs({ uid, type, startDate, endDate, page = 1, limit = 50 }) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

  const query = {};
  if (uid && uid !== "all") query.uid = uid;

  if (type && type !== "all") {
    query.type = type;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const total = await db.collection("balanceLogs").countDocuments(query);

  const logs = await db
    .collection("balanceLogs")
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}
