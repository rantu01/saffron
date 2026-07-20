import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const { adminAuth } = await import("../lib/firebaseAdmin.js");

try {
  const list = await adminAuth.listUsers(20);
  console.log("TOTAL AUTH USERS (sampled):", list.users.length);
  list.users.forEach((u) => console.log("-", u.email || u.uid, "| uid:", u.uid));
  if (list.users.length === 0) {
    console.log(">>> No users in Firebase Authentication for project saffron-edge-6c242");
  }
} catch (e) {
  console.error("ERROR listing auth users:", e?.message || e);
}
