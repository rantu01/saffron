import clientPromise from "./mongodb";

export async function createLoginHistory({ uid, email = "", ip = "", userAgent = "", result = "success", failureReason = "" }) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

  const entry = {
    uid: uid || null,
    email: email || "",
    ip: ip || "",
    userAgent: userAgent || "",
    result: result || "success",
    failureReason: failureReason || "",
    createdAt: new Date(),
  };

  const insertResult = await db.collection("loginHistory").insertOne(entry);
  return { ...entry, _id: insertResult.insertedId };
}

export async function getLoginHistory({ uid = null, result = null, startDate = null, endDate = null, page = 1, limit = 50 } = {}) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

  const query = {};
  if (uid) query.uid = uid;
  if (result) query.result = result;
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

  const [entries, total] = await Promise.all([
    db.collection("loginHistory").find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    db.collection("loginHistory").countDocuments(query),
  ]);

  return { entries, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}
