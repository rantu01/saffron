import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

function getDb() {
  return clientPromise.then((client) => client.db(DB_NAME));
}

export async function sendMessage({ conversationId, senderUid, senderRole, senderName, message, imageUrl }) {
  const db = await getDb();
  const doc = {
    conversationId,
    senderUid,
    senderRole,
    senderName,
    message: message || "",
    imageUrl: imageUrl || null,
    createdAt: new Date(),
    readAt: null,
  };
  const result = await db.collection("messages").insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function getMessages({ conversationId, limit = 50, before }) {
  const db = await getDb();
  const query = { conversationId };
  if (before) {
    query._id = { $lt: new ObjectId(before) };
  }
  const messages = await db
    .collection("messages")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return messages.reverse().map((m) => ({ ...m, _id: m._id.toString() }));
}

export async function getNewMessages({ conversationId, afterId }) {
  const db = await getDb();
  const query = { conversationId };
  if (afterId) {
    query._id = { $gt: new ObjectId(afterId) };
  }
  const messages = await db
    .collection("messages")
    .find(query)
    .sort({ createdAt: 1 })
    .toArray();
  return messages.map((m) => ({ ...m, _id: m._id.toString() }));
}

export async function getConversations() {
  const db = await getDb();
  const conversations = await db
    .collection("messages")
    .aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$message" },
          lastMessageAt: { $first: "$createdAt" },
          lastSenderRole: { $first: "$senderRole" },
          lastSenderName: { $first: "$senderName" },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$readAt", null] }, { $ne: ["$senderRole", "admin"] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "uid",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          conversationId: "$_id",
          _id: 0,
          userUid: "$user.uid",
          userName: { $ifNull: ["$user.displayName", "$user.email", "Unknown"] },
          userEmail: "$user.email",
          lastMessage: 1,
          lastMessageAt: 1,
          lastSenderRole: 1,
          lastSenderName: 1,
          messageCount: 1,
          unreadCount: 1,
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ])
    .toArray();
  return conversations;
}

export async function markConversationAsRead({ conversationId, byUid }) {
  const db = await getDb();
  await db.collection("messages").updateMany(
    { conversationId, readAt: null, senderUid: { $ne: byUid } },
    { $set: { readAt: new Date() } }
  );
}

export async function getUnreadCountForUser({ conversationId, uid }) {
  const db = await getDb();
  return db.collection("messages").countDocuments({
    conversationId,
    readAt: null,
    senderUid: { $ne: uid },
  });
}

export async function getTotalUnreadMessageCount() {
  const db = await getDb();
  return db.collection("messages").countDocuments({
    readAt: null,
    senderRole: { $ne: "admin" },
  });
}
