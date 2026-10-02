import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

function normalizeAuthDomain(value) {
  const configuredDomain = String(value || "").trim().replace(/^['"]|['"]$/g, "");
  if (!configuredDomain) {
    throw new Error("Firebase auth domain is not configured.");
  }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(configuredDomain)
    ? configuredDomain
    : `https://${configuredDomain}`;

  let parsedDomain;
  try {
    parsedDomain = new URL(candidate);
  } catch {
    throw new Error("Firebase auth domain is invalid.");
  }

  if (
    !["http:", "https:"].includes(parsedDomain.protocol) ||
    !parsedDomain.hostname ||
    parsedDomain.username ||
    parsedDomain.password ||
    parsedDomain.pathname !== "/" ||
    parsedDomain.search ||
    parsedDomain.hash
  ) {
    throw new Error("Firebase auth domain is invalid.");
  }

  return parsedDomain.host;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: normalizeAuthDomain(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;