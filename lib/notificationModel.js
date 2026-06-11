import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

function getDb() {
  return clientPromise.then((client) => client.db(DB_NAME));
}

export async function createNotification({ uid, type, title, message, metadata = {} }) {
  const db = await getDb();
  const notification = {
    uid,
    type,
    title,
    message,
    isRead: false,
    metadata,
    createdAt: new Date(),
  };
  const result = await db.collection("notifications").insertOne(notification);
  return { ...notification, _id: result.insertedId };
}

export async function getNotifications({ uid, page = 1, limit = 50 }) {
  const db = await getDb();
  const query = { uid };
  const total = await db.collection("notifications").countDocuments(query);
  const notifications = await db
    .collection("notifications")
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
  return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function markNotificationsAsRead(ids, uid) {
  const db = await getDb();
  const objectIds = ids.map((id) => new ObjectId(id));
  await db.collection("notifications").updateMany(
    { _id: { $in: objectIds }, uid },
    { $set: { isRead: true } }
  );
}

export async function markAllNotificationsAsRead(uid) {
  const db = await getDb();
  await db.collection("notifications").updateMany(
    { uid, isRead: false },
    { $set: { isRead: true } }
  );
}

export async function getUnreadNotificationCount(uid) {
  const db = await getDb();
  return db.collection("notifications").countDocuments({ uid, isRead: false });
}
