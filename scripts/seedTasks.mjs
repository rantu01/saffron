import fs from "fs";
import { MongoClient } from "mongodb";

// Load .env
const envRaw = fs.readFileSync(".env", "utf8");
const env = {};
for (const line of envRaw.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const uri = env.MONGODB_URI;
const dbName = env.MONGODB_DB_NAME || "saffron";

const APP_NAMES = [
  "TikTok", "Instagram", "WhatsApp", "Telegram", "Facebook", "YouTube",
  "Snapchat", "Zoom", "Spotify", "Netflix", "Amazon", "AliExpress",
  "Shein", "Temu", "CapCut", "Discord", "Reddit", "Pinterest", "LinkedIn",
  "Twitter", "Threads", "CashApp", "PayPal", "Binance", "Coinbase", "Uber",
  "Airbnb", "Foodpanda", "Grab", "Shopee", "Lazada", "Tokopedia", "Gojek",
  "WeChat", "Kwai", "Bigo Live", "Likee", "Helo", "Twitch",
];

const RATING_OPTIONS = [
  "Peace of mind and security, very good app.",
  "Convenient, easy, and simple.",
  "Update too often.",
  "This is very good software.",
  "Free is quite good, but from time to time it shows that the server is busy, I hope to get improved.",
];

const rand = (min, max) => Math.random() * (max - min) + min;
const round2 = (v) => Math.round(v * 100) / 100;

function pickUniqueApps(n) {
  const pool = [...APP_NAMES];
  const out = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

// 1. Delete existing tasks and task groups.
const delTasks = await db.collection("tasks").deleteMany({});
const delGroups = await db.collection("taskGroups").deleteMany({});
console.log(`Deleted tasks: ${delTasks.deletedCount}, taskGroups: ${delGroups.deletedCount}`);

const groupNames = ["Set 1", "Set 2", "Set 3"];
const now = new Date();

for (const name of groupNames) {
  const groupRes = await db.collection("taskGroups").insertOne({
    name,
    description: `${name} task group`,
    createdAt: now,
    updatedAt: now,
  });
  const groupId = groupRes.insertedId.toString();

  const taskCount = 30; // each set must contain 30 tasks
  const apps = pickUniqueApps(taskCount);

  const tasks = apps.map((appName) => {
    const totalAmount = round2(rand(20, 60));
    const profit = round2(totalAmount * 0.005);
    return {
      appName,
      appLogo: "",
      description: `${appName} promotion task`,
      totalAmount,
      profit,
      reward: profit,
      isTemplate: true,
      taskGroupId: groupId,
      submissionConfig: {
        requireRating: true,
        ratingOptions: RATING_OPTIONS,
        requireFeedback: true,
        maxFeedbackLength: 500,
      },
      assigneeUid: null,
      assigneeEmail: null,
      status: "available",
      createdAt: now,
      updatedAt: now,
    };
  });

  await db.collection("tasks").insertMany(tasks);
  const sum = tasks.reduce((a, t) => a + t.totalAmount, 0);
  console.log(`${name}: ${tasks.length} tasks, total $${round2(sum).toFixed(2)}`);
}

await client.close();
console.log("Done.");
