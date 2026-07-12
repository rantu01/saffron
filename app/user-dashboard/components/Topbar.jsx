"use client";

import { useAuth } from "@/app/Component/Auth/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/app/Component/Common/NotificationBell";
import { ArrowLeft } from "lucide-react";

export default function UserTopbar({ onToggle }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === '/user-dashboard';
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
    <header className="sticky top-0 z-20 border-b xl:border-[#F1E7DF] border-transparent xl:bg-white/90 bg-[#121212] backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-8">
        {/* Mobile topbar — ultra-minimalist dark */}
        <div className="flex w-full items-center justify-between xl:hidden">
          <div className="flex items-center gap-3">
            {!isDashboard && (
              <Link href="/user-dashboard" className="text-white hover:text-[#FBBF24] transition-colors">
                <ArrowLeft size={20} />
              </Link>
            )}
            {/* <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FBBF24]">Saffron Edge</p> */}
          </div>
          <div className="flex items-center gap-2">
            {profile?.referralCode && (
              <div className="flex items-center gap-1 rounded-lg border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-2 py-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#FBBF24]">Ref</span>
                <span className="font-mono text-[11px] font-bold tracking-wider text-[#FBBF24]">{profile.referralCode}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(profile.referralCode); }}
                  className="text-[#FBBF24]/70 hover:text-[#FBBF24] p-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:border-red-400/60"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Desktop topbar — original clean style */}
        <div className="hidden min-w-0 items-center gap-4 xl:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C2410C]">Dashboard</p>
            <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">Welcome{profile?.displayName ? `, ${profile.displayName}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}</h1>
          </div>
          {profile?.referralCode && (
            <div className="flex items-center gap-2 rounded-xl border border-[#E05305]/20 bg-gradient-to-r from-[#E05305]/10 to-[#E05305]/5 px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#E05305]">Ref</span>
              <span className="font-mono text-sm font-bold tracking-wider text-[#E05305]">{profile.referralCode}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(profile.referralCode); }}
                className="rounded-md bg-[#E05305] px-2 py-0.5 text-[10px] font-medium text-white hover:bg-[#c84a04] transition"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        <div className="hidden items-center gap-3 sm:gap-4 xl:flex">
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
