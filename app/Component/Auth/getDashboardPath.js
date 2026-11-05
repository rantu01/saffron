import { normalizeRole } from "@/lib/roles";

/**
 * Map MongoDB user roles to dashboard paths.
 * - admin              -> /admin
 * - training           -> /user-dashboard (training dashboard)
 * - any other role     -> /user-dashboard
 *
 * This ensures that:
 * - Admin users are redirected to the Admin Dashboard.
 * - Other users are redirected based on their MongoDB role.
 * - Users cannot access dashboards that do not match their assigned roles.
 */
export function getDashboardPath(role) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "admin") {
    return "/admin";
  }
  // For other roles (user, training, etc.), redirect to user dashboard
  // The specific dashboard can be determined by the application's role-based routing
  return "/user-dashboard";
}
