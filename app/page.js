"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import { getDashboardPath } from "@/app/Component/Auth/getDashboardPath";
import { getAuthorizedRole } from "@/app/Component/Auth/getAuthorizedRole";
import { Loader2 } from "lucide-react";

/**
 * Root route acts purely as an auth gate (no homepage content):
 *  - not logged in  -> /login
 *  - logged in      -> role-specific dashboard (admin -> /admin,
 *                      everyone else -> /user-dashboard)
 * Dashboard layouts keep enforcing their own role guards, so unauthorized
 * users can never land on a dashboard they lack permission for.
 */
export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user?.uid) {
      router.replace("/login");
      return;
    }

    let mounted = true;
    async function redirectByRole() {
      try {
        const role = await getAuthorizedRole(user);
        if (mounted) router.replace(getDashboardPath(role));
      } catch {
        if (mounted) router.replace("/login");
      }
    }
    redirectByRole();
    return () => {
      mounted = false;
    };
  }, [loading, user?.uid, user?.email, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 text-[#E05305] animate-spin" />
    </div>
  );
}
