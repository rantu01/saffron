"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminNotificationCounts } from "./components/AdminNotificationContext";

function Badge({ count }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-2.5 -right-2.5 flex items-center justify-center min-w-[22px] h-[22px] px-1 text-xs font-bold text-white bg-red-500 rounded-full leading-none shadow-md">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    users: 0, tasks: 0, availableCodes: 0,
    pendingDeposits: 0, pendingWithdrawals: 0,
    totalDeposits: 0, totalWithdrawals: 0, balanceLogs: 0,
    completedTasks: 0, comboTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const { pendingDeposits, unreadMessages } = useAdminNotificationCounts();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [usersRes, tasksRes, invitesRes, depositsRes, withdrawalsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/tasks"),
          fetch("/api/admin/invitations"),
          fetch("/api/admin/deposits"),
          fetch("/api/admin/withdrawals"),
        ]);

        const usersData = await usersRes.json();
        const tasksData = await tasksRes.json();
        const invitesData = await invitesRes.json();
        const depositsData = await depositsRes.json();
        const withdrawalsData = await withdrawalsRes.json();

        if (cancelled) return;

        const tasks = tasksData.tasks || [];
        const invitationList = invitesData.invitations || [];
        const deposits = depositsData.deposits || [];
        const withdrawals = withdrawalsData.withdrawals || [];

        setStats({
          users: (usersData.users || []).length,
          tasks: tasks.length,
          availableCodes: invitationList.filter((item) => !item.usedByUid).length,
          pendingDeposits: deposits.filter((d) => d.status === "pending").length,
          pendingWithdrawals: withdrawals.filter((w) => w.status === "pending").length,
          totalDeposits: deposits.length,
          totalWithdrawals: withdrawals.length,
          balanceLogs: 0,
          completedTasks: tasks.filter((t) => t.status === "completed").length,
          comboTasks: tasks.filter((t) => t.isCombinationTask || t.taskType === "combination").length,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, color: "bg-blue-50 text-blue-600 border-blue-200", href: null },
    { label: "Total Tasks", value: stats.tasks, color: "bg-purple-50 text-purple-600 border-purple-200", href: null },
    { label: "Completed Tasks", value: stats.completedTasks, color: "bg-emerald-50 text-emerald-600 border-emerald-200", href: null },
    { label: "Combination Tasks", value: stats.comboTasks, color: "bg-amber-50 text-amber-600 border-amber-200", href: null },
    { label: "Pending Deposits", value: stats.pendingDeposits, color: "bg-amber-50 text-amber-600 border-amber-200", href: "/admin/deposits", badge: true },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, color: "bg-red-50 text-red-600 border-red-200", href: null },
    { label: "Available Codes", value: stats.availableCodes, color: "bg-teal-50 text-teal-600 border-teal-200", href: null },
    { label: "Total Deposits", value: stats.totalDeposits, color: "bg-indigo-50 text-indigo-600 border-indigo-200", href: null },
    { label: "Total Withdrawals", value: stats.totalWithdrawals, color: "bg-rose-50 text-rose-600 border-rose-200", href: null },
    { label: "Live Chat", value: unreadMessages, color: "bg-sky-50 text-sky-600 border-sky-200", href: "/admin/chat", badge: true },
  ];

  function getBadge(label) {
    if (label === "Pending Deposits") return pendingDeposits;
    if (label === "Live Chat") return unreadMessages;
    return 0;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Dashboard Overview</h1>
      <p className="text-sm text-slate-500 mb-6">Real-time platform statistics and metrics</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const badgeCount = card.badge ? getBadge(card.label) : 0;
          const Wrapper = card.href ? Link : "div";
          const wrapperProps = card.href ? { href: card.href, className: "relative block" } : { className: "relative" };
          return (
            <Wrapper key={card.label} {...wrapperProps}>
              <div className={`rounded-xl border p-5 ${card.color} ${card.href ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium opacity-80">{card.label}</p>
                  {card.badge && badgeCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold mt-1">
                  {loading && !card.badge ? "..." : card.badge ? badgeCount : card.value}
                </p>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
