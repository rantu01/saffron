import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

async function getWithdrawalsCollection() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "saffron").collection("withdrawals");
}

export async function createWithdrawal(uid, email, walletAddress, amount, network = "TRC20") {
  const collection = await getWithdrawalsCollection();
  
  const withdrawal = {
    uid,
    email,
    walletAddress,
    network,
    amount: Number(amount),
    status: "pending",
    createdAt: new Date(),
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    approverUid: null,
  };

  const result = await collection.insertOne(withdrawal);
  return { ...withdrawal, _id: result.insertedId };
}

export async function getWithdrawalsByUid(uid) {
  const collection = await getWithdrawalsCollection();
  return collection.find({ uid }).toArray();
}

export async function getAllWithdrawals() {
  const collection = await getWithdrawalsCollection();
  return collection.find({}).toArray();
}

export async function getWithdrawalsPage({ status = null, page = 1, limit = 50 } = {}) {
  const collection = await getWithdrawalsCollection();
  const query = status ? { status } : {};
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (safePage - 1) * safeLimit;
  const [withdrawals, total] = await Promise.all([
    collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    collection.countDocuments(query),
  ]);
  return { withdrawals, total, page: safePage, limit: safeLimit };
}

export async function updateWithdrawalStatus(withdrawalId, status, approverUid = null, rejectionReason = null, session = null) {
  const collection = await getWithdrawalsCollection();

  const updateDoc = {
    status,
    ...(status === "approved" && { approvedAt: new Date(), approverUid }),
    ...(status === "rejected" && { rejectedAt: new Date(), rejectionReason }),
  };

  const options = { returnDocument: "after" };
  if (session) options.session = session;

  // Only a pending withdrawal can transition. This is the idempotency guard
  // used by the approval route before any balance is debited.
  return collection.findOneAndUpdate(
    { _id: new ObjectId(withdrawalId), status: "pending" },
    { $set: updateDoc },
    options
  );
}

export async function reopenWithdrawalStatus(withdrawalId) {
  const collection = await getWithdrawalsCollection();

  return collection.findOneAndUpdate(
    { _id: new ObjectId(withdrawalId), status: "approved" },
    {
      $set: {
        status: "pending",
        approvedAt: null,
        approverUid: null,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
}

export async function getWithdrawalById(withdrawalId, session = null) {
  const collection = await getWithdrawalsCollection();
  const options = session ? { session } : {};
  return collection.findOne({ _id: new ObjectId(withdrawalId) }, options);
}
