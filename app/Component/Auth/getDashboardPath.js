import { normalizeRole } from "@/lib/roles";

/**
 * Single source of truth for role -> dashboard mapping.
 * Mirrors the existing role/permission configuration used across
 * the login page, signup form, and dashboard layout guards:
 *  - admin             -> /admin
 *  - user (and any other role, e.g. training) -> /user-dashboard
 */
export function getDashboardPath(role) {
  return normalizeRole(role) === "admin" ? "/admin" : "/user-dashboard";
}
