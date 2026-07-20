import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in environment variables."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
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
