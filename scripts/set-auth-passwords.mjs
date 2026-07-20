import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const { adminAuth } = await import("../lib/firebaseAdmin.js");

// Set this to the password you want for all existing auth users.
const NEW_PASSWORD = "Saffron@123";

async function main() {
  const list = await adminAuth.listUsers(1000);
  console.log(`Found ${list.users.length} auth users. Setting password...`);

  let updated = 0;
  let failed = 0;
  for (const u of list.users) {
    try {
      await adminAuth.updateUser(u.uid, { password: NEW_PASSWORD });
      updated++;
    } catch (e) {
      failed++;
      console.error(`Failed for ${u.email || u.uid}:`, e?.message || e);
    }
  }
  console.log(`Done. Updated: ${updated}, Failed: ${failed}`);
  console.log(`New password for all users: ${NEW_PASSWORD}`);
}

main().catch((e) => console.error(e));
