export function normalizeRole(role) {
  const normalizedRole = String(role || "user").trim().toLowerCase();
  return normalizedRole || "user";
}

