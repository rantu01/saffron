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

const APPS = [
  { name: "LinkedIn",        logo: "https://www.google.com/s2/favicons?sz=128&domain=linkedin.com" },
  { name: "Pinterest",       logo: "https://www.google.com/s2/favicons?sz=128&domain=pinterest.com" },
  { name: "BeReal",          logo: "https://www.google.com/s2/favicons?sz=128&domain=bereal.com" },
  { name: "Signal",          logo: "https://www.google.com/s2/favicons?sz=128&domain=signal.org" },
  { name: "WeChat",          logo: "https://www.google.com/s2/favicons?sz=128&domain=wechat.com" },
  { name: "YouTube",         logo: "https://www.google.com/s2/favicons?sz=128&domain=youtube.com" },
  { name: "Netflix",         logo: "https://www.google.com/s2/favicons?sz=128&domain=netflix.com" },
  { name: "Spotify",         logo: "https://www.google.com/s2/favicons?sz=128&domain=spotify.com" },
  { name: "Disney+",         logo: "https://www.google.com/s2/favicons?sz=128&domain=disneyplus.com" },
  { name: "Amazon Prime Video", logo: "https://www.google.com/s2/favicons?sz=128&domain=primevideo.com" },
  { name: "Hulu",            logo: "https://www.google.com/s2/favicons?sz=128&domain=hulu.com" },
  { name: "HBO Max",         logo: "https://www.google.com/s2/favicons?sz=128&domain=max.com" },
  { name: "SoundCloud",      logo: "https://www.google.com/s2/favicons?sz=128&domain=soundcloud.com" },
  { name: "Twitch",          logo: "https://www.google.com/s2/favicons?sz=128&domain=twitch.tv" },
  { name: "Apple Music",     logo: "https://www.google.com/s2/favicons?sz=128&domain=music.apple.com" },
  { name: "Gmail",           logo: "https://www.google.com/s2/favicons?sz=128&domain=gmail.com" },
  { name: "Google Drive",    logo: "https://www.google.com/s2/favicons?sz=128&domain=drive.google.com" },
  { name: "Microsoft Outlook", logo: "https://www.google.com/s2/favicons?sz=128&domain=outlook.com" },
  { name: "Microsoft Word",  logo: "https://www.google.com/s2/favicons?sz=128&domain=microsoft.com" },
  { name: "Microsoft Excel", logo: "https://www.google.com/s2/favicons?sz=128&domain=microsoft.com" },
  { name: "Notion",          logo: "https://www.google.com/s2/favicons?sz=128&domain=notion.so" },
  { name: "Slack",           logo: "https://www.google.com/s2/favicons?sz=128&domain=slack.com" },
  { name: "Zoom",            logo: "https://www.google.com/s2/favicons?sz=128&domain=zoom.us" },
  { name: "Google Meet",     logo: "https://www.google.com/s2/favicons?sz=128&domain=meet.google.com" },
  { name: "Trello",          logo: "https://www.google.com/s2/favicons?sz=128&domain=trello.com" },
  { name: "Asana",           logo: "https://www.google.com/s2/favicons?sz=128&domain=asana.com" },
  { name: "Evernote",        logo: "https://www.google.com/s2/favicons?sz=128&domain=evernote.com" },
  { name: "Todoist",         logo: "https://www.google.com/s2/favicons?sz=128&domain=todoist.com" },
  { name: "Google Docs",     logo: "https://www.google.com/s2/favicons?sz=128&domain=docs.google.com" },
  { name: "Dropbox",         logo: "https://www.google.com/s2/favicons?sz=128&domain=dropbox.com" },
  { name: "Amazon",          logo: "https://www.google.com/s2/favicons?sz=128&domain=amazon.com" },
  { name: "eBay",            logo: "https://www.google.com/s2/favicons?sz=128&domain=ebay.com" },
  { name: "PayPal",          logo: "https://www.google.com/s2/favicons?sz=128&domain=paypal.com" },
  { name: "Venmo",           logo: "https://www.google.com/s2/favicons?sz=128&domain=venmo.com" },
  { name: "Cash App",        logo: "https://www.google.com/s2/favicons?sz=128&domain=cash.app" },
  { name: "Walmart",         logo: "https://www.google.com/s2/favicons?sz=128&domain=walmart.com" },
  { name: "Etsy",            logo: "https://www.google.com/s2/favicons?sz=128&domain=etsy.com" },
  { name: "Shopify",         logo: "https://www.google.com/s2/favicons?sz=128&domain=shopify.com" },
  { name: "Robinhood",       logo: "https://www.google.com/s2/favicons?sz=128&domain=robinhood.com" },
  { name: "Mint",            logo: "https://www.google.com/s2/favicons?sz=128&domain=mint.com" },
  { name: "Uber Eats",       logo: "https://www.google.com/s2/favicons?sz=128&domain=ubereats.com" },
  { name: "DoorDash",        logo: "https://www.google.com/s2/favicons?sz=128&domain=doordash.com" },
  { name: "Grubhub",         logo: "https://www.google.com/s2/favicons?sz=128&domain=grubhub.com" },
  { name: "Starbucks",       logo: "https://www.google.com/s2/favicons?sz=128&domain=starbucks.com" },
  { name: "McDonald's",      logo: "https://www.google.com/s2/favicons?sz=128&domain=mcdonalds.com" },
  { name: "Yelp",            logo: "https://www.google.com/s2/favicons?sz=128&domain=yelp.com" },
  { name: "Uber",            logo: "https://www.google.com/s2/favicons?sz=128&domain=uber.com" },
  { name: "Lyft",            logo: "https://www.google.com/s2/favicons?sz=128&domain=lyft.com" },
  { name: "Google Maps",     logo: "https://www.google.com/s2/favicons?sz=128&domain=maps.google.com" },
  { name: "Airbnb",          logo: "https://www.google.com/s2/favicons?sz=128&domain=airbnb.com" },
  { name: "Booking.com",     logo: "https://www.google.com/s2/favicons?sz=128&domain=booking.com" },
  { name: "Expedia",         logo: "https://www.google.com/s2/favicons?sz=128&domain=expedia.com" },
  { name: "Waze",            logo: "https://www.google.com/s2/favicons?sz=128&domain=waze.com" },
  { name: "TripAdvisor",     logo: "https://www.google.com/s2/favicons?sz=128&domain=tripadvisor.com" },
  { name: "MyFitnessPal",    logo: "https://www.google.com/s2/favicons?sz=128&domain=myfitnesspal.com" },
  { name: "Strava",          logo: "https://www.google.com/s2/favicons?sz=128&domain=strava.com" },
  { name: "Nike Run Club",   logo: "https://www.google.com/s2/favicons?sz=128&domain=nike.com" },
  { name: "Headspace",       logo: "https://www.google.com/s2/favicons?sz=128&domain=headspace.com" },
  { name: "Calm",            logo: "https://www.google.com/s2/favicons?sz=128&domain=calm.com" },
  { name: "Fitbit",          logo: "https://www.google.com/s2/favicons?sz=128&domain=fitbit.com" },
  { name: "Peloton",         logo: "https://www.google.com/s2/favicons?sz=128&domain=onepeloton.com" },
  { name: "Candy Crush Saga", logo: "https://www.google.com/s2/favicons?sz=128&domain=king.com" },
  { name: "Roblox",          logo: "https://www.google.com/s2/favicons?sz=128&domain=roblox.com" },
  { name: "Minecraft",       logo: "https://www.google.com/s2/favicons?sz=128&domain=minecraft.net" },
  { name: "Among Us",        logo: "https://www.google.com/s2/favicons?sz=128&domain=innersloth.com" },
  { name: "Subway Surfers",  logo: "https://www.google.com/s2/favicons?sz=128&domain=sybogames.com" },
  { name: "PUBG Mobile",     logo: "https://www.google.com/s2/favicons?sz=128&domain=pubgmobile.com" },
  { name: "Clash of Clans",  logo: "https://www.google.com/s2/favicons?sz=128&domain=supercell.com" },
  { name: "Pokemon GO",      logo: "https://www.google.com/s2/favicons?sz=128&domain=pokemongolive.com" },
  { name: "8 Ball Pool",     logo: "https://www.google.com/s2/favicons?sz=128&domain=miniclip.com" },
  { name: "Call of Duty Mobile", logo: "https://www.google.com/s2/favicons?sz=128&domain=callofduty.com" },
  { name: "Google Chrome",   logo: "https://www.google.com/s2/favicons?sz=128&domain=google.com" },
  { name: "Adobe Acrobat Reader", logo: "https://www.google.com/s2/favicons?sz=128&domain=adobe.com" },
  { name: "CamScanner",      logo: "https://www.google.com/s2/favicons?sz=128&domain=camscanner.com" },
  { name: "VLC",             logo: "https://www.google.com/s2/favicons?sz=128&domain=videolan.org" },
  { name: "Google Translate", logo: "https://www.google.com/s2/favicons?sz=128&domain=translate.google.com" },
  { name: "1Password",       logo: "https://www.google.com/s2/favicons?sz=128&domain=1password.com" },
  { name: "NordVPN",         logo: "https://www.google.com/s2/favicons?sz=128&domain=nordvpn.com" },
  { name: "Files by Google", logo: "https://www.google.com/s2/favicons?sz=128&domain=files.google.com" },
  { name: "VSCO",            logo: "https://www.google.com/s2/favicons?sz=128&domain=vsco.co" },
  { name: "CapCut",          logo: "https://www.google.com/s2/favicons?sz=128&domain=capcut.com" },
  { name: "Canva",           logo: "https://www.google.com/s2/favicons?sz=128&domain=canva.com" },
  { name: "Adobe Lightroom", logo: "https://www.google.com/s2/favicons?sz=128&domain=adobe.com" },
  { name: "PicsArt",         logo: "https://www.google.com/s2/favicons?sz=128&domain=picsart.com" },
  { name: "Snapseed",        logo: "https://www.google.com/s2/favicons?sz=128&domain=snapseed.online" },
  { name: "Kindle",          logo: "https://www.google.com/s2/favicons?sz=128&domain=amazon.com" },
  { name: "Duolingo",        logo: "https://www.google.com/s2/favicons?sz=128&domain=duolingo.com" },
  { name: "Audible",         logo: "https://www.google.com/s2/favicons?sz=128&domain=audible.com" },
  { name: "Google News",     logo: "https://www.google.com/s2/favicons?sz=128&domain=news.google.com" },
  { name: "Medium",          logo: "https://www.google.com/s2/favicons?sz=128&domain=medium.com" },
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
  const pool = [...APPS.map((a) => a.name)];
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

  const taskCount = 40; // groups must contain at least the largest VIP set size (VIP 4 = 40 tasks)
  const apps = pickUniqueApps(taskCount);
  const appMap = Object.fromEntries(APPS.map((a) => [a.name, a.logo]));

  const tasks = apps.map((appName) => {
    const totalAmount = round2(rand(20, 60));
    const profit = round2(totalAmount * 0.005);
    return {
      appName,
      appLogo: appMap[appName] || "",
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
