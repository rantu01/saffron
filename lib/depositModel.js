import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

async function getDepositsCollection() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "saffron").collection("deposits");
}

export async function createDeposit(uid, email, amount, screenshotBase64) {
  const collection = await getDepositsCollection();
  
  const deposit = {
    uid,
    email,
    amount: Number(amount),
    screenshot: screenshotBase64,
    status: "pending",
    createdAt: new Date(),
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,
  };

  const result = await collection.insertOne(deposit);
  return { ...deposit, _id: result.insertedId };
}

export async function getDepositsByUid(uid) {
  const collection = await getDepositsCollection();
  return collection.find({ uid }).toArray();
}

export async function getAllDeposits() {
  const collection = await getDepositsCollection();
  return collection.find({}).toArray();
}

export async function updateDepositStatus(depositId, status, approverUid = null, rejectionReason = null, session = null) {
  const collection = await getDepositsCollection();

  const updateDoc = {
    status,
    ...(status === "approved" && { approvedAt: new Date(), approverUid }),
    ...(status === "rejected" && { rejectedAt: new Date(), rejectionReason }),
  };

  const options = { returnDocument: "after" };
  if (session) options.session = session;

  // Only a pending deposit can transition. This is the idempotency guard used
  // by the approval route before any balance is credited.
  return collection.findOneAndUpdate(
    { _id: new ObjectId(depositId), status: "pending" },
    { $set: updateDoc },
    options
  );
}

export async function getDepositById(depositId, session = null) {
  const collection = await getDepositsCollection();
  const options = session ? { session } : {};
  return collection.findOne({ _id: new ObjectId(depositId) }, options);
}

export async function getPendingDepositCount() {
  const collection = await getDepositsCollection();
  return collection.countDocuments({ status: "pending" });
}
