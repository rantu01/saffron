import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

const options = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
};

let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, options).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, options).connect();
  }
  clientPromise = global._mongoClientPromise;
}

async function createIndexes() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    await Promise.all([
      db.collection("deposits").createIndex({ status: 1 }, { background: true }),
      db.collection("messages").createIndex({ readAt: 1 }, { background: true }),
      db.collection("messages").createIndex({ senderRole: 1, readAt: 1 }, { background: true }),
      db.collection("messages").createIndex({ conversationId: 1, readAt: 1 }, { background: true }),
    ]);
  } catch {
  }
}

createIndexes();

export default clientPromise;
