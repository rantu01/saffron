"use client";

import { useAuth } from "@/app/Component/Auth/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "@/app/Component/Common/NotificationBell";

export default function UserTopbar({ onToggle }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
    router.refresh();
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.uid) return setProfile(null);
      const res = await fetch(`/api/user/profile?uid=${encodeURIComponent(user.uid)}`);
      const data = await res.json();
      if (mounted && data?.success) setProfile(data.user);
    }
    load();
    return () => (mounted = false);
  }, [user?.uid]);

  return (
    <header className="sticky top-0 z-20 border-b lg:border-[#F1E7DF] border-transparent lg:bg-white/90 bg-[#121212] backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Mobile topbar — ultra-minimalist dark */}
        <div className="flex w-full items-center justify-between lg:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FBBF24]">Saffron Edge</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:border-red-400/60"
          >
            Logout
          </button>
        </div>

        {/* Desktop topbar — original clean style */}
        <div className="hidden min-w-0 items-center gap-3 lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C2410C]">Dashboard</p>
            <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">Welcome{profile?.displayName ? `, ${profile.displayName}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}</h1>
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:gap-4 lg:flex">
          <NotificationBell uid={user?.uid} />
          <div className="flex items-center gap-3 rounded-2xl border border-[#F1E7DF] bg-white px-3 py-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-[#F59E0B] to-[#EA580C] text-sm font-bold text-white">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="h-full w-full flex items-center justify-center">SE</span>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{profile?.displayName || user?.email || 'Member'}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500">Account</p>
                <button onClick={handleLogout} className="text-xs text-red-600 underline ml-2">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
