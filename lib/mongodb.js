import { MongoClient } from "mongodb";
import { ensureDatabaseIndexes } from "./dbIndexes";

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

const options = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 20,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
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

let indexesPromise;

function ensureIndexesOnce() {
  if (!indexesPromise) {
    indexesPromise = clientPromise
      .then((client) => ensureDatabaseIndexes(client.db(DB_NAME)))
      .catch((error) => {
        console.error("Database index initialization failed:", error?.message || error);
      });
  }
  return indexesPromise;
}

// Never block a request on index creation; queries still work while MongoDB
// builds indexes in the background.
ensureIndexesOnce();

export default clientPromise;
