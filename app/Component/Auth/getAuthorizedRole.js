export async function getAuthorizedRole(user) {
  if (!user?.uid) {
    throw new Error("Authentication is required.");
  }

  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/role", {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  const result = await response.json();

  if (!response.ok || !result?.success || !result.role) {
    throw new Error(result?.message || "Unable to verify your account role.");
  }

  return result.role;
}
