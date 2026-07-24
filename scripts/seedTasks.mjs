import fs from "fs";
import { MongoClient } from "mongodb";
import { generateTasksForGroup } from "../lib/taskGenerator.js";

// Load .env
const envRaw = fs.readFileSync(".env", "utf8");
const env = {};
for (const line of envRaw.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const uri = env.MONGODB_URI;
const dbName = env.MONGODB_DB_NAME || "saffron";

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

// 1. Delete existing tasks and task groups.
const delTasks = await db.collection("tasks").deleteMany({});
const delGroups = await db.collection("taskGroups").deleteMany({});
console.log(`Deleted tasks: ${delTasks.deletedCount}, taskGroups: ${delGroups.deletedCount}`);

const groupNames = ["Set 1", "Set 2", "Set 3"];
const now = new Date();

const taskCount = 40; // groups must contain at least the largest VIP set size (VIP 4 = 40 tasks)

for (const name of groupNames) {
  const groupRes = await db.collection("taskGroups").insertOne({
    name,
    description: `${name} task group`,
    createdAt: now,
    updatedAt: now,
  });
  const groupId = groupRes.insertedId.toString();

  const tasks = generateTasksForGroup(groupId, taskCount);

  await db.collection("tasks").insertMany(tasks);
  const sum = tasks.reduce((a, t) => a + t.totalAmount, 0);
  console.log(`${name}: ${tasks.length} tasks, total $${sum.toFixed(2)}`);
}

await client.close();
console.log("Done.");
