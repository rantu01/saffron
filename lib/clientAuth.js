"use client";

import { auth } from "@/lib/firebaseClient";

let currentAuthUser = null;

export function setCurrentAuthUser(user) {
  currentAuthUser = user;
}

export async function getAuthToken() {
  if (!currentAuthUser) return null;
  try {
    return await currentAuthUser.getIdToken();
  } catch {
    return null;
  }
}

export async function getAuthHeaders() {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Patch global fetch once on the client so every existing call site that hits
// /api/* automatically carries the Firebase ID token. This keeps the existing
// happy paths working after server-side auth enforcement is enabled.
export function installAuthFetch() {
  if (typeof window === "undefined" || window.__authFetchInstalled) return;
  window.__authFetchInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    try {
      let url = "";
      if (typeof input === "string") url = input;
      else if (input && typeof input.url === "string") url = input.url;

      const isApi =
        url.startsWith("/api/") ||
        url.startsWith("/api?") ||
        url === "/api" ||
        (typeof window !== "undefined" &&
          (url.startsWith(window.location.origin + "/api/") ||
            url.startsWith(window.location.origin + "/api?") ||
            url === window.location.origin + "/api"));

      if (isApi) {
        const headers = new Headers(
          init?.headers || (input instanceof Request ? input.headers : undefined)
        );
        if (!headers.has("Authorization")) {
          const token = await getAuthToken();
          if (token) headers.set("Authorization", `Bearer ${token}`);
        }
        init = { ...(init || {}), headers };
      }
    } catch {
      // Fall through to original fetch on any failure.
    }
    return originalFetch(input, init);
  };
}
