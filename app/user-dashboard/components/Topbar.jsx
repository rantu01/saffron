"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Copy, Sparkles } from "lucide-react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import NotificationBell from "@/app/Component/Common/NotificationBell";

export default function UserTopbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [profile, setProfile] = useState(null);
  const isDashboard = pathname === "/user-dashboard";

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.uid) {
        setProfile(null);
        return;
      }
      const res = await fetch(`/api/user/profile?uid=${encodeURIComponent(user.uid)}`);
      const data = await res.json();
      if (mounted && data?.success) setProfile(data.user);
    }
    load();
    return () => { mounted = false; };
  }, [user?.uid]);

  return (
    <header className="user-topbar sticky top-0 z-20">
      <div className="user-topbar-inner">
        <div className="user-brand">
          {!isDashboard && (
            <Link href="/user-dashboard" className="user-back" aria-label="Back to dashboard">
              <ArrowLeft size={18} />
            </Link>
          )}
          <Link href="/user-dashboard" className="user-brand-mark" aria-label="Saffron Edge dashboard">
            {/* <span className="user-brand-icon"><Sparkles size={16} aria-hidden="true" /></span> */}
            <span>SAFFRON <b>EDGE</b></span>
          </Link>
        </div>
        <div className="user-topbar-actions">
          {profile?.referralCode && (
            <button
              type="button"
              className="user-referral-chip"
              onClick={() => navigator.clipboard.writeText(profile.referralCode)}
              aria-label={`Copy referral code ${profile.referralCode}`}
            >
              <span>Ref {profile.referralCode}</span>
              <Copy size={13} aria-hidden="true" />
            </button>
          )}
          <div className="user-notification" aria-label="Notifications">
            <NotificationBell uid={user?.uid} />
          </div>
          <div className="user-avatar" aria-label={profile?.displayName || "Account"}>
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" />
            ) : (
              (profile?.displayName || user?.email || "SE").slice(0, 2).toUpperCase()
            )}
          </div>
          <ChevronDown size={14} className="user-avatar-chevron" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
