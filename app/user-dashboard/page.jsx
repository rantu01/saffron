"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";

export default function UserDashboardPage() {
  const { user, loading } = useAuth();
  const [dashboard, setDashboard] = useState({ availableBalance: 0, tasks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return '0.00';
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  useEffect(() => {
    async function loadDashboard() {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        const response = await fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load dashboard.");
        }

        setDashboard(result.dashboard);
      } catch (err) {
        setError(err.message || "Failed to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [user?.uid]);

  if (loading || isLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-10 text-slate-600">Loading dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">User Dashboard</h1>
        <p className="mt-2 text-slate-600">Please login to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">User Dashboard</h1>
      <p className="mt-2 text-slate-600">Welcome, {user.email}</p>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Available Balance</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">${formatMoney(dashboard.availableBalance)}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Assigned Tasks</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.tasks?.length || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Tasks Completed</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{(dashboard.tasks || []).filter(t => t.status === 'completed').length}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm md:col-span-3">
          <p className="text-sm text-slate-500">Total Earned (from completed tasks)</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">${formatMoney((dashboard.tasks || []).filter(t => t.status === 'completed').reduce((s, t) => s + Number(t.earnedAmount ?? t.reward ?? 0), 0))}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">Your Tasks</h2>
        <div className="mt-4 space-y-3">
          {dashboard.tasks?.length ? (
            dashboard.tasks.map((task) => (
              <div key={task._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900">{task.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{task.description || "No description"}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 capitalize">
                    {task.status || "pending"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-slate-600">No tasks assigned yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
