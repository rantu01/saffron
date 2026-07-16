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

export async function updateWithdrawalStatus(withdrawalId, status, approverUid = null, rejectionReason = null) {
  const collection = await getWithdrawalsCollection();
  
  const updateDoc = {
    status,
    ...(status === "approved" && { approvedAt: new Date(), approverUid }),
    ...(status === "rejected" && { rejectedAt: new Date(), rejectionReason }),
  };

  return collection.findOneAndUpdate(
    { _id: new ObjectId(withdrawalId) },
    { $set: updateDoc },
    { returnDocument: "after" }
  );
}

export async function getWithdrawalById(withdrawalId) {
  const collection = await getWithdrawalsCollection();
  return collection.findOne({ _id: new ObjectId(withdrawalId) });
}
