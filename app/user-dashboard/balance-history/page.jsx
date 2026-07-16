"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";

function daysAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function toDateStr(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "numeric", day: "numeric", year: "numeric",
  });
}

function toTimeStr(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "task_earnings", label: "Task Earnings" },
  { value: "referral_commission", label: "Referral Commission" },
  { value: "balance_push", label: "Balance Push" },
];

export default function BalanceHistoryPage() {
  const { user, loading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    let cancelled = false;
    async function loadLogs() {
      if (!user?.uid) { setIsLoading(false); return; }
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ uid: user.uid, page, limit: "50" });
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await fetch(`/api/user/balance-logs?${params}`);
        const data = await res.json();

        if (cancelled) return;
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load history");

        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load transaction history.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadLogs();
    return () => { cancelled = true; };
  }, [user?.uid, page, typeFilter, startDate, endDate]);

  const handleExport = async () => {
    if (!user?.uid) return;
    const params = new URLSearchParams({ uid: user.uid });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    try {
      const res = await fetch(`/api/user/balance-logs/export?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `balance-history-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      Swal.fire({ icon: "success", title: "Exported!", timer: 1000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Export failed", text: err.message });
    }
  };

  const badgeForType = (type) => {
    const map = {
      deposit: { label: "CREDIT", class: "bg-blue-50 text-blue-600 border-blue-200/50" },
      withdrawal: { label: "DEBIT", class: "bg-red-50 text-red-600 border-red-200/50" },
      task_earnings: { label: "EARNED", class: "bg-emerald-50 text-emerald-600 border-emerald-200/50" },
      referral_commission: { label: "REFERRAL", class: "bg-purple-50 text-purple-600 border-purple-200/50" },
      balance_push: { label: "PUSH", class: "bg-slate-100 text-slate-700 border-slate-200/50" },
    };
    return map[type] || { label: type, class: "bg-slate-100 text-slate-600 border-slate-200/50" };
  };

  if (loading || isLoading) {
    return <div className="p-6 text-slate-600 font-medium">Loading history...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Balance History</h1>
        <p className="mt-2 text-slate-600">Please login to view transaction history.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold  tracking-tight">Balance History</h1>
          <p className="text-sm  mt-1">View your account balance transaction history</p>
        </div>
        <button
          onClick={handleExport}
          className="mt-3 sm:mt-0 flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-200 text-sm w-max">{error}</div>
      )}

      <div className="bg-white text-black rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
          />

          {(startDate || endDate || typeFilter !== "all") && (
            <button
              onClick={() => { setTypeFilter("all"); setStartDate(""); setEndDate(""); setPage(1); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">
            Transactions {total > 0 && <span className="text-sm font-normal text-slate-400">({total} total)</span>}
          </h2>
        </div>

        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center  text-sm">No transactions yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75  text-xs font-bold uppercase tracking-wider border-b border-slate-200/60 select-none">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Balance</th>
                  <th className="py-4 px-6">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm ">
                {logs.map((log) => {
                  const badge = badgeForType(log.type);
                  const isPositive = Number(log.amount) >= 0;

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/40 transition align-top">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{toDateStr(log.createdAt)}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{daysAgo(log.createdAt)} at {toTimeStr(log.createdAt)}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide border ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className={`py-4 px-6 font-bold whitespace-nowrap ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                        {isPositive ? "+" : ""}${formatMoney(Math.abs(log.amount))}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500 whitespace-nowrap">
                        ${formatMoney(log.balanceBefore)} → ${formatMoney(log.balanceAfter)}
                      </td>
                      <td className="py-4 px-6 min-w-[200px]">
                        <div className="font-medium text-slate-800 leading-snug">{log.description}</div>
                        {log.referenceId && (
                          <div className="text-xs text-slate-400 font-mono mt-0.5 break-all">Ref: {log.referenceId.slice(0, 20)}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
