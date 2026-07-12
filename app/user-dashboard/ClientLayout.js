'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/Component/Auth/AuthProvider';
import UserSidebar from './components/Sidebar';
import UserTopbar from './components/Topbar';
import {
  AppWindowMac, ListChecks, Share2, User, DollarSign,
  CreditCard, Send, Wallet, History, LayoutDashboard, Grid3X3, FileText,
  ArrowDownToLine, ArrowUpFromLine, Globe, Headphones, LogOut, Copy, ChevronRight, X, MessageCircle
} from 'lucide-react';
import LiveChat from '@/app/Component/Common/LiveChat';

const mobileNavItems = [
  // { label: 'Dashboard', href: '/user-dashboard', icon: AppWindowMac },
  { label: 'Live Chat', href: '/user-dashboard/chat', icon: MessageCircle },
  { label: 'My Tasks', href: '/user-dashboard/tasks', icon: ListChecks },
  { label: 'Referrals', href: '/user-dashboard/referrals', icon: Share2 },
  { label: 'Profile', href: '/user-dashboard/profile', icon: User },
  { label: 'Deposits', href: '/user-dashboard/deposits', icon: DollarSign },
  { label: 'Payments', href: '/user-dashboard/payments', icon: CreditCard },
  { label: 'Withdrawals', href: '/user-dashboard/withdrawals', icon: Send },
  // { label: 'Balance', href: '/user-dashboard/balance', icon: Wallet },
  { label: 'Balance History', href: '/user-dashboard/balance-history', icon: History },
  
];

const bottomNavItems = [
  { label: 'Home', href: '/user-dashboard', icon: LayoutDashboard },
  { label: 'Starting', href: '/user-dashboard/tasks', icon: Grid3X3 },
  { label: 'Records', href: '/user-dashboard/records', icon: FileText },
];

const drawerMenuItems = [
  { label: 'Deposit', href: '/user-dashboard/deposits', icon: ArrowDownToLine },
  { label: 'My Tasks', href: '/user-dashboard/tasks', icon: ListChecks },
  { label: 'Referrals', href: '/user-dashboard/referrals', icon: Share2 },
  { label: 'Withdraw', href: '/user-dashboard/withdrawals', icon: ArrowUpFromLine },
  { label: 'Personal Info', href: '/user-dashboard/profile', icon: User },
  { label: 'Payments', href: '/user-dashboard/payments', icon: CreditCard },
  { label: 'Transaction', href: '/user-dashboard/records', icon: CreditCard },
  { label: 'Wallet Bind', href: '/user-dashboard/balance', icon: Wallet },
  { label: 'Live Chat', href: '/user-dashboard/chat', icon: MessageCircle },
  { label: 'Balance History', href: '/user-dashboard/balance-history', icon: History },
  // { label: 'Language', href: '#', icon: Globe },
  // { label: 'Customer Service', href: '#', icon: Headphones },
  { label: 'Log out', href: '#', icon: LogOut },
];

export default function ClientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [roleChecking, setRoleChecking] = React.useState(true);
  const isDashboard = pathname === '/user-dashboard';
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileData, setProfileData] = React.useState(null);
  const [refCode, setRefCode] = React.useState('');
  const [dashData, setDashData] = React.useState(null);

  React.useEffect(() => {
    if (!mobileMenuOpen || !user?.uid) return;
    async function fetchDrawerData() {
      try {
        const [profileRes, refRes, dashRes] = await Promise.all([
          fetch(`/api/user/profile?uid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/user/referral?uid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`),
        ]);
        const profile = await profileRes.json();
        const ref = await refRes.json();
        const dash = await dashRes.json();
        if (profile?.success) setProfileData(profile.profile);
        if (ref?.success) setRefCode(ref.referral.referralCode || '');
        if (dash?.success) setDashData(dash.dashboard);
      } catch (err) {
        console.error(err);
      }
    }
    fetchDrawerData();
  }, [mobileMenuOpen, user?.uid]);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    async function checkRole() {
      try {
        const res = await fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`);
        const data = await res.json();
        if (res.ok && data?.success && data?.dashboard?.role === 'admin') {
          router.replace('/admin');
          return;
        }
      } catch (err) {
        console.error('Role check failed:', err);
      }
      setRoleChecking(false);
    }
    checkRole();
  }, [loading, router, user]);

  if (loading || !user || roleChecking) {
    return <div className='min-h-screen xl:bg-[#FFF8F3] bg-[#121212]' />;
  }

  return (
    <>
      <UserSidebar open={open} onClose={() => setOpen(false)} />
      <div className='min-h-screen xl:pl-64 flex flex-col'>
        <UserTopbar onToggle={() => setOpen((v) => !v)} />

        {/* MOBILE APP LAUNCHER - only on main dashboard */}
        {isDashboard && (
        <div className="xl:hidden bg-[#121212] px-4 pt-2 pb-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FBBF24]">
              Saffron Edge
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">
              Welcome{user?.displayName ? `, ${user.displayName}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#FBBF24] p-1.5 aspect-square"
                >
                  <Icon size={16} className="text-slate-900" />
                  <span className="text-[9px] font-bold text-slate-900 text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* <div className="mt-6 rounded-2xl bg-slate-800/80 h-44 flex items-center justify-center overflow-hidden border border-slate-700/50">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-xs text-slate-500">Featured Content</p>
            </div>
          </div> */}
        </div>
        )}

        <main className="px-4 pb-20 xl:pb-0 py-6 sm:px-6 xl:px-8 xl:py-8 xl:bg-transparent bg-[#121212] h-full">
          <div className='mx-auto w-full max-w-7xl h-full'>{children}</div>
        </main>
      </div>

      {/* MOBILE SLIDE-IN DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-[280px] bg-[#121212] shadow-2xl overflow-y-auto animate-slide-in-left">
            <div className="p-5">
              {/* Close button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              {/* Header Section */}
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                  {profileData?.avatarUrl ? (
                    <img src={profileData.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user?.displayName || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-bold text-base truncate">
                    {profileData?.displayName || user?.displayName || 'User'}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-[#FBBF24] text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {refCode || '------'}
                    </span>
                    <button
                      onClick={async () => {
                        if (refCode) {
                          try { await navigator.clipboard.writeText(refCode); } catch {}
                        }
                      }}
                      className="text-slate-500 hover:text-white text-[10px] flex items-center gap-0.5 transition-colors"
                    >
                      <Copy size={10} />
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Credibility Progress */}
              <div className="mb-5">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Credibility</span>
                  <span className="text-[#FBBF24] font-bold">100%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-full rounded-full bg-[#FBBF24]" />
                </div>
              </div>

              {/* Financial Cards */}
              <div className="space-y-3 mb-6">
                {/* Today Profit */}
                <div className="border border-yellow-500/40 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-xs">Today profit</span>
                    <span className="text-[#FBBF24] text-xs font-bold">
                      USDC/T {dashData?.totalEarned ? Number(dashData.totalEarned).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">The system will automatic update the daily earnings</p>
                </div>

                {/* Wallet Amount */}
                <div className="border border-yellow-500/40 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#FBBF24] text-xs">Wallet Amount</span>
                    <span className="text-[#FBBF24] text-xs font-bold">
                      USDC/T {dashData?.availableBalance ? Number(dashData.availableBalance).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu List */}
              <div className="space-y-0.5">
                {drawerMenuItems.map((item) => {
                  const isLogout = item.label === 'Log out';
                  return (
                    <div key={item.label}>
                      {isLogout ? (
                        <button
                          onClick={async () => {
                            setMobileMenuOpen(false);
                            await logout();
                            router.replace('/');
                            router.refresh();
                          }}
                          className="w-full flex items-center justify-between py-2.5 px-1 rounded-lg hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon size={18} className="text-red-400" />
                            <span className="text-sm font-medium text-red-400">{item.label}</span>
                          </div>
                          <ChevronRight size={14} className="text-red-400/60" />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between py-2.5 px-1 rounded-lg hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon size={18} className="text-[#FBBF24]" />
                            <span className="text-sm font-medium text-white">{item.label}</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-600" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* <LiveChat /> */}

      {/* MOBILE BOTTOM NAV - visible on all dashboard pages */}
      <div className="fixed bottom-0 left-0 right-0 z-50 xl:hidden bg-[#FBBF24]">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            if (item.label === 'Home') {
              return (
                <button
                  key={item.label}
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex flex-col items-center gap-0.5 px-4 py-1 text-slate-900"
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 ${isActive ? 'text-slate-900' : 'text-slate-700'}`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
