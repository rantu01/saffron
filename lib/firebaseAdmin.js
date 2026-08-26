import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_BASE64 in environment variables."
    );
  }

  let serviceAccount;
  try {
    const json = Buffer.from(base64, "base64").toString("utf-8");
    serviceAccount = JSON.parse(json);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is not a valid Base64-encoded JSON.");
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

let cachedAdminApp = null;
let cachedAdminAuth = null;

// Lazily initialize the Firebase Admin app. Deferring this to first use (instead
// of module-load time) prevents `next build` page-data collection from requiring
// credentials that are only present at runtime.
export function getAdminApp() {
  if (cachedAdminApp) return cachedAdminApp;
  cachedAdminApp = getFirebaseAdminApp();
  return cachedAdminApp;
}

export function getAdminAuth() {
  if (cachedAdminAuth) return cachedAdminAuth;
  cachedAdminAuth = getAuth(getAdminApp());
  return cachedAdminAuth;
}

// NOTE: Do NOT initialize at module scope. Consumers must call getAdminApp()
// / getAdminAuth() lazily so that `next build` page-data collection does not
// require credentials at import time.
export const adminApp = null;
export const adminAuth = null;
export default null;
