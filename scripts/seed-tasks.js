// Run: node scripts/seed-tasks.js
// Creates a task group and 30 different task templates

const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URI = "mongodb+srv://saffron:vGfwrTUrEbbytQE6@saffron.ce7fwce.mongodb.net/?appName=saffron";
const DB_NAME = "saffron";

const APPS = [
  { name: "Subway Surfer", amount: 42 },
  { name: "Candy Crush Saga", amount: 38 },
  { name: "Temple Run 2", amount: 45 },
  { name: "PUBG Mobile", amount: 55 },
  { name: "Clash of Clans", amount: 50 },
  { name: "Angry Birds 2", amount: 35 },
  { name: "Instagram", amount: 60 },
  { name: "Facebook", amount: 65 },
  { name: "WhatsApp", amount: 40 },
  { name: "Snapchat", amount: 48 },
  { name: "Spotify", amount: 52 },
  { name: "Netflix", amount: 70 },
  { name: "YouTube", amount: 75 },
  { name: "Amazon Shopping", amount: 58 },
  { name: "Uber", amount: 44 },
  { name: "Google Maps", amount: 36 },
  { name: "Twitter (X)", amount: 32 },
  { name: "LinkedIn", amount: 46 },
  { name: "Telegram", amount: 30 },
  { name: "TikTok", amount: 62 },
  { name: "CapCut", amount: 28 },
  { name: "Canva", amount: 54 },
  { name: "Zoom", amount: 42 },
  { name: "Google Drive", amount: 34 },
  { name: "Microsoft Teams", amount: 48 },
  { name: "Discord", amount: 40 },
  { name: "Pinterest", amount: 38 },
  { name: "AliExpress", amount: 56 },
  { name: "Shopee", amount: 50 },
  { name: "Flipkart", amount: 44 },
];

const RATING_OPTIONS = [
  "Peace of mind and security, very good app.",
  "Convenient, easy, and simple.",
  "Update too often.",
  "This is very good software.",
  "Free is quite good, but from time to time it shows that the server is busy, I hope to get improved."
];

async function seed() {
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db(DB_NAME);

  const groupResult = await db.collection("taskGroups").insertOne({
    name: "Default Group",
    description: "Auto-generated group with 30 tasks",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const groupId = groupResult.insertedId.toString();
  console.log("Created group: Default Group (" + groupId + ")");

  const now = new Date();
  const tasks = APPS.map((app) => {
    const totalAmount = app.amount;
    const profit = Math.round(totalAmount * 0.5) / 100;
    return {
      appName: app.name,
      appLogo: "",
      description: "Complete tasks for " + app.name + " and earn profit.",
      totalAmount,
      profit,
      reward: profit,
      isTemplate: true,
      taskGroupId: groupId,
      submissionConfig: {
        requireRating: true,
        ratingOptions: [...RATING_OPTIONS],
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

  const insertResult = await db.collection("tasks").insertMany(tasks);
  console.log("Created " + insertResult.insertedCount + " task templates");

  await client.close();
  console.log("\nDone! Now go to Admin > Task Management and assign 'Default Group' to a user.");
}

seed().catch(console.error);
