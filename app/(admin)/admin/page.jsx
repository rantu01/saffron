"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    users: 0, tasks: 0, availableCodes: 0,
    pendingDeposits: 0, pendingWithdrawals: 0,
    totalDeposits: 0, totalWithdrawals: 0, balanceLogs: 0,
    completedTasks: 0, comboTasks: 0,
  });
  const [loading, setLoading] = useState(true);

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
    { label: "Total Users", value: stats.users, color: "bg-blue-50 text-blue-600 border-blue-200" },
    { label: "Total Tasks", value: stats.tasks, color: "bg-purple-50 text-purple-600 border-purple-200" },
    { label: "Completed Tasks", value: stats.completedTasks, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { label: "Combination Tasks", value: stats.comboTasks, color: "bg-amber-50 text-amber-600 border-amber-200" },
    { label: "Pending Deposits", value: stats.pendingDeposits, color: "bg-amber-50 text-amber-600 border-amber-200" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, color: "bg-red-50 text-red-600 border-red-200" },
    { label: "Available Codes", value: stats.availableCodes, color: "bg-teal-50 text-teal-600 border-teal-200" },
    { label: "Total Deposits", value: stats.totalDeposits, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    { label: "Total Withdrawals", value: stats.totalWithdrawals, color: "bg-rose-50 text-rose-600 border-rose-200" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Dashboard Overview</h1>
      <p className="text-sm text-slate-500 mb-6">Real-time platform statistics and metrics</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-5 ${card.color}`}>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{loading ? "..." : card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
