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

const APPS_GROUP2 = [
  { name: "Adobe Photoshop Express", amount: 40 },
  { name: "Lightroom", amount: 38 },
  { name: "Microsoft Office", amount: 65 },
  { name: "Google Chrome", amount: 30 },
  { name: "Firefox", amount: 28 },
  { name: "VLC Media Player", amount: 25 },
  { name: "WinRAR", amount: 20 },
  { name: "Notion", amount: 50 },
  { name: "Trello", amount: 42 },
  { name: "Slack", amount: 55 },
  { name: "Asana", amount: 45 },
  { name: "Dropbox", amount: 48 },
  { name: "OneDrive", amount: 36 },
  { name: "Evernote", amount: 32 },
  { name: "Medium", amount: 28 },
  { name: "Quora", amount: 22 },
  { name: "Reddit", amount: 35 },
  { name: "Stack Overflow", amount: 30 },
  { name: "GitHub", amount: 58 },
  { name: "GitLab", amount: 52 },
  { name: "Bitbucket", amount: 40 },
  { name: "Docker", amount: 60 },
  { name: "Kubernetes", amount: 70 },
  { name: "VS Code", amount: 45 },
  { name: "Sublime Text", amount: 30 },
  { name: "Postman", amount: 38 },
  { name: "Figma", amount: 55 },
  { name: "InVision", amount: 42 },
  { name: "Zeplin", amount: 34 },
  { name: "Miro", amount: 48 },
];

const APPS_GROUP3 = [
  { name: "Booking.com", amount: 55 },
  { name: "Airbnb", amount: 60 },
  { name: "Expedia", amount: 50 },
  { name: "Skyscanner", amount: 40 },
  { name: "Kayak", amount: 38 },
  { name: "TripAdvisor", amount: 45 },
  { name: "Agoda", amount: 48 },
  { name: "MakeMyTrip", amount: 42 },
  { name: "OYO", amount: 35 },
  { name: "Goibibo", amount: 38 },
  { name: "Uber Eats", amount: 50 },
  { name: "Zomato", amount: 45 },
  { name: "Swiggy", amount: 44 },
  { name: "DoorDash", amount: 52 },
  { name: "Grubhub", amount: 48 },
  { name: "Deliveroo", amount: 40 },
  { name: "Foodpanda", amount: 36 },
  { name: "Domino's", amount: 32 },
  { name: "McDonald's", amount: 28 },
  { name: "Starbucks", amount: 35 },
  { name: "KFC", amount: 30 },
  { name: "Burger King", amount: 28 },
  { name: "Subway", amount: 25 },
  { name: "Pizza Hut", amount: 32 },
  { name: "Dunkin' Donuts", amount: 26 },
  { name: "Chipotle", amount: 38 },
  { name: "Panera Bread", amount: 34 },
  { name: "Olive Garden", amount: 40 },
  { name: "Cheesecake Factory", amount: 45 },
  { name: "Wendy's", amount: 28 },
];

const APPS_GROUP4 = [
  { name: "PayPal", amount: 50 },
  { name: "Google Pay", amount: 35 },
  { name: "Apple Pay", amount: 40 },
  { name: "PhonePe", amount: 38 },
  { name: "Paytm", amount: 42 },
  { name: "Amazon Pay", amount: 45 },
  { name: "Venmo", amount: 32 },
  { name: "Stripe", amount: 55 },
  { name: "Square", amount: 48 },
  { name: "Razorpay", amount: 40 },
  { name: "Braintree", amount: 35 },
  { name: "Coinbase", amount: 65 },
  { name: "Binance", amount: 70 },
  { name: "Kraken", amount: 55 },
  { name: "Robinhood", amount: 58 },
  { name: "Zerodha", amount: 45 },
  { name: "Groww", amount: 38 },
  { name: "Upstox", amount: 36 },
  { name: "Angel One", amount: 34 },
  { name: "ICICI Direct", amount: 42 },
  { name: "HDFC Bank", amount: 40 },
  { name: "SBI YONO", amount: 35 },
  { name: "Kotak 811", amount: 30 },
  { name: "Axis Mobile", amount: 32 },
  { name: "Citi Mobile", amount: 38 },
  { name: "Niyo", amount: 28 },
  { name: "Cred", amount: 45 },
  { name: "Mobikwik", amount: 30 },
  { name: "Freecharge", amount: 28 },
  { name: "Airtel Thanks", amount: 34 },
];

const APPS_GROUP5 = [
  { name: "Duolingo", amount: 32 },
  { name: "Khan Academy", amount: 28 },
  { name: "Coursera", amount: 55 },
  { name: "Udemy", amount: 50 },
  { name: "edX", amount: 48 },
  { name: "Skillshare", amount: 42 },
  { name: "MasterClass", amount: 65 },
  { name: "Brilliant", amount: 38 },
  { name: "Codecademy", amount: 40 },
  { name: "SoloLearn", amount: 25 },
  { name: "Quizlet", amount: 22 },
  { name: "Chegg", amount: 35 },
  { name: "Photomath", amount: 18 },
  { name: "Wolfram Alpha", amount: 30 },
  { name: "Google Classroom", amount: 20 },
  { name: "Microsoft Learn", amount: 30 },
  { name: "LinkedIn Learning", amount: 52 },
  { name: "Pluralsight", amount: 48 },
  { name: "Datacamp", amount: 42 },
  { name: "Udacity", amount: 58 },
  { name: "AlgoExpert", amount: 70 },
  { name: "LeetCode", amount: 45 },
  { name: "HackerRank", amount: 35 },
  { name: "Codeforces", amount: 30 },
  { name: "Exercism", amount: 22 },
  { name: "GeeksforGeeks", amount: 28 },
  { name: "W3Schools", amount: 18 },
  { name: "FreeCodeCamp", amount: 15 },
  { name: "The Odin Project", amount: 20 },
  { name: "Scrimba", amount: 32 },
];

const RATING_OPTIONS = [
  "Peace of mind and security, very good app.",
  "Convenient, easy, and simple.",
  "Update too often.",
  "This is very good software.",
  "Free is quite good, but from time to time it shows that the server is busy, I hope to get improved."
];

async function seedGroup(db, groupName, apps) {
  const groupResult = await db.collection("taskGroups").insertOne({
    name: groupName,
    description: "Auto-generated group with " + apps.length + " tasks",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const groupId = groupResult.insertedId.toString();
  console.log("Created group: " + groupName + " (" + groupId + ")");

  const now = new Date();
  const tasks = apps.map((app) => {
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
  console.log("Created " + insertResult.insertedCount + " task templates for " + groupName);
}

async function seed() {
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db(DB_NAME);

  await seedGroup(db, "Default Group", APPS);
  await seedGroup(db, "Group 2", APPS_GROUP2);
  await seedGroup(db, "Group 3", APPS_GROUP3);
  await seedGroup(db, "Group 4", APPS_GROUP4);
  await seedGroup(db, "Group 5", APPS_GROUP5);

  await client.close();
  console.log("\nDone! All groups created. Go to Admin > Task Management to assign groups.");
}

seed().catch(console.error);
