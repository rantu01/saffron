import clientPromise from "./mongodb";

const VERSIONS = "termsVersions";
const ACCEPTANCES = "termsAcceptances";

const DEFAULT_TERMS_CONTENT = `Terms & Conditions

1. VIP Levels
The platform offers four VIP levels. Each level has its own daily group limit, tasks per group, and profit rate.

VIP-1 Beginner: Daily Group Limit 3, Tasks per Group 20, Profit Rate 0.5%
VIP-2 Advanced: Daily Group Limit 4, Tasks per Group 25, Profit Rate 0.6%
VIP-3 Expert: Daily Group Limit 5, Tasks per Group 35, Profit Rate 0.8%
VIP-4 Master: Daily Group Limit 6, Tasks per Group 60, Profit Rate 1%

2. Withdrawals
Users may submit multiple withdrawal requests per day, subject to applicable withdrawal requirements. Withdrawal eligibility, minimum/maximum amounts, fees, and processing conditions are governed by existing verified platform rules.

3. Funds
User funds are stored in the user account and can be withdrawn upon completion of applicable tasks.

4. Account Security
Each user is eligible for one workbench account. Do not disclose passwords to third parties.

5. Tasks and Orders
Tasks are allocated by the system. Combined tasks may be triggered at configured positions within a task set. Completed task and financial records are preserved.

6. Invitations
Referral commissions apply as configured by the platform.

7. Operation Time
Platform operating hours apply as configured.

Note: Additional verification deposit requirements, large-amount transaction channels and thresholds, exact withdrawal amount limits, and exact fund-freezing conditions are subject to separate business confirmation and are not specified here.`;

let termsSeedPromise = null;
async function ensureDefaultTermsVersion(language = "en") {
  const lang = String(language || "en").trim() || "en";
  if (lang !== "en") return;
  if (termsSeedPromise) return termsSeedPromise;
  termsSeedPromise = (async () => {
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
      const existing = await db.collection(VERSIONS).findOne({ status: "published", language: "en" });
      if (existing) return;
      const now = new Date();
      await db.collection(VERSIONS).insertOne({
        version: "1.0",
        content: DEFAULT_TERMS_CONTENT,
        status: "published",
        language: "en",
        effectiveFrom: now,
        createdBy: "system",
        publishedAt: now,
        publishedBy: "system",
        createdAt: now,
        updatedAt: now,
      });
    } catch (e) {
      termsSeedPromise = null;
    }
  })();
  return termsSeedPromise;
}

export async function getActiveTermsVersion(language = "en") {
  const lang = String(language || "en").trim() || "en";
  await ensureDefaultTermsVersion(lang);
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  let doc = await db.collection(VERSIONS).findOne(
    { status: "published", language: lang },
    { sort: { effectiveFrom: -1, createdAt: -1 } }
  );
  if (!doc && lang !== "en") {
    doc = await db.collection(VERSIONS).findOne(
      { status: "published", language: "en" },
      { sort: { effectiveFrom: -1, createdAt: -1 } }
    );
  }
  if (!doc) {
    doc = await db.collection(VERSIONS).findOne(
      { status: "published" },
      { sort: { effectiveFrom: -1, createdAt: -1 } }
    );
  }
  return doc;
}

export async function listTermsVersions({ page = 1, limit = 50 } = {}) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (safePage - 1) * safeLimit;
  const [versions, total] = await Promise.all([
    db.collection(VERSIONS).find({}).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    db.collection(VERSIONS).countDocuments({}),
  ]);
  return { versions, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}

export async function createTermsVersion({ version, content, effectiveFrom = null, createdBy = null, status = "draft", language = "en" }) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const now = new Date();
  const doc = {
    version: String(version || "").trim(),
    content: content || "",
    status,
    language: String(language || "en").trim() || "en",
    effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : now,
    createdBy: createdBy || null,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection(VERSIONS).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function publishTermsVersion(id, { actorUid = null } = {}) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const { ObjectId } = await import("mongodb");
  const now = new Date();
  await db.collection(VERSIONS).updateMany({ status: "published" }, { $set: { status: "archived", updatedAt: now } });
  const result = await db.collection(VERSIONS).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status: "published", publishedAt: now, publishedBy: actorUid, updatedAt: now } },
    { returnDocument: "after" }
  );
  return result;
}

export async function recordTermsAcceptance({ uid, version, ip = "", userAgent = "", source = "signup" }) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const doc = {
    uid,
    version: String(version || "").trim(),
    acceptedAt: new Date(),
    ip: ip || "",
    userAgent: userAgent || "",
    source: source || "signup",
  };
  const result = await db.collection(ACCEPTANCES).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function hasAcceptedTerms(uid, version) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const doc = await db.collection(ACCEPTANCES).findOne({ uid, version: String(version || "").trim() });
  return Boolean(doc);
}

export async function getTermsAcceptances({ uid = null, version = null, page = 1, limit = 50 } = {}) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "saffron");
  const query = {};
  if (uid) query.uid = uid;
  if (version) query.version = String(version).trim();
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (safePage - 1) * safeLimit;
  const [entries, total] = await Promise.all([
    db.collection(ACCEPTANCES).find(query).sort({ acceptedAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    db.collection(ACCEPTANCES).countDocuments(query),
  ]);
  return { entries, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}
