'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/Component/Auth/AuthProvider';
import UserSidebar from './components/Sidebar';
import UserTopbar from './components/Topbar';
import {
  AppWindowMac, ListChecks, Share2, User, DollarSign,
  CreditCard, Send, Wallet, History, LayoutDashboard, Grid3X3, FileText
} from 'lucide-react';

const mobileNavItems = [
  { label: 'Dashboard', href: '/user-dashboard', icon: AppWindowMac },
  { label: 'My Tasks', href: '/user-dashboard/tasks', icon: ListChecks },
  { label: 'Referrals', href: '/user-dashboard/referrals', icon: Share2 },
  { label: 'Profile', href: '/user-dashboard/profile', icon: User },
  { label: 'Deposits', href: '/user-dashboard/deposits', icon: DollarSign },
  { label: 'Payments', href: '/user-dashboard/payments', icon: CreditCard },
  { label: 'Withdrawals', href: '/user-dashboard/withdrawals', icon: Send },
  { label: 'Balance', href: '/user-dashboard/balance', icon: Wallet },
  { label: 'Balance History', href: '/user-dashboard/balance-history', icon: History },
];

const bottomNavItems = [
  { label: 'Home', href: '/user-dashboard', icon: LayoutDashboard },
  { label: 'Starting', href: '/user-dashboard/tasks', icon: Grid3X3 },
  { label: 'Records', href: '/user-dashboard/payments', icon: FileText },
];

export default function ClientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return <div className='min-h-screen lg:bg-[#FFF8F3] bg-[#121212]' />;
  }

  return (
    <>
      <UserSidebar open={open} onClose={() => setOpen(false)} />
      <div className='min-h-screen lg:pl-64'>
        <UserTopbar onToggle={() => setOpen((v) => !v)} />

        {/* MOBILE APP LAUNCHER */}
        <div className="lg:hidden bg-[#121212] px-4 pt-2 pb-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FBBF24]">
              Saffron Edge
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">
              Welcome{user?.displayName ? `, ${user.displayName}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#FBBF24] p-3 aspect-square"
                >
                  <Icon size={24} className="text-slate-900" />
                  <span className="text-[10px] font-bold text-slate-900 text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-800/80 h-44 flex items-center justify-center overflow-hidden border border-slate-700/50">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-xs text-slate-500">Featured Content</p>
            </div>
          </div>
        </div>

        <main className='px-4 mb-16 py-6 sm:px-6 lg:px-8 lg:py-8 lg:bg-transparent bg-[#121212]'>
          <div className='mx-auto w-full max-w-7xl'>{children}</div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="fixed bottom-0 left-0  right-0 z-50 lg:hidden bg-[#FBBF24]">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
