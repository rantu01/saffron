import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

let client;
let clientPromise;

async function createIndexes() {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB_NAME || "saffron";
  const db = client.db(dbName);

  await Promise.all([
    db.collection("deposits").createIndex({ status: 1 }, { background: true }),
    db.collection("messages").createIndex({ readAt: 1 }, { background: true }),
    db.collection("messages").createIndex({ senderRole: 1, readAt: 1 }, { background: true }),
    db.collection("messages").createIndex({ conversationId: 1, readAt: 1 }, { background: true }),
  ]);
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect().then((c) => {
      createIndexes().catch(() => {});
      return c;
    });
  }

  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect().then((c) => {
    createIndexes().catch(() => {});
    return c;
  });
}

export default clientPromise;