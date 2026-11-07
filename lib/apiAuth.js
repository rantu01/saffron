import { getAdminAuth } from "./firebaseAdmin";
import { getUserByUid } from "./userModel";
import { normalizeRole } from "./roles";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function getBearerToken(request) {
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * Shared server-side Firebase ID-token verification.
 *
 * This is Phase 2 task 2.2: a single reusable boundary for authenticated route
 * handlers. It is NOT yet wired into route handlers; task 2.3 will enforce it on
 * admin routes, followed by task 2.4 for user-scoped routes.
 */
export async function requireFirebaseAuth(request, options = {}) {
  const { requireRole = true } = options;
  const token = getBearerToken(request);
  if (!token) {
    throw new ApiError(401, "Authentication is required.");
  }

  const decodedToken = await getAdminAuth().verifyIdToken(token);
  const uid = decodedToken?.uid;
  const user = uid ? await getUserByUid(uid) : null;

  if (requireRole && !user?.role) {
    throw new ApiError(403, "Your account does not have an assigned role.");
  }

  return { uid, user, decodedToken };
}

export function requireAdminUser(user) {
  const role = normalizeRole(user?.role);
  if (role !== "admin") {
    throw new ApiError(403, "Admin role required.");
  }
  return { uid: user.uid, user };
}
