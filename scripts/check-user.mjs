import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const { adminAuth } = await import("../lib/firebaseAdmin.js");

const email = process.argv[2] || "admin@gmail.com";
try {
  const user = await adminAuth.getUserByEmail(email);
  console.log("email:", user.email);
  console.log("uid:", user.uid);
  console.log("disabled:", user.disabled);
  console.log("emailVerified:", user.emailVerified);
  console.log("providers:", user.providerData.map((p) => p.providerId));
  console.log("passwordHash?:", user.passwordHash ? "set" : "NOT set");
  console.log("passwordSalt?:", user.passwordSalt ? "set" : "NOT set");
  console.log("metadata.createdAt:", user.metadata.creationTime);
  console.log("lastSignIn:", user.metadata.lastSignInTime);
} catch (e) {
  console.error("ERROR:", e?.message || e);
}
