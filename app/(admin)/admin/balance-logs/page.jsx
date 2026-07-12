"use client";

import { useEffect, useState, useCallback } from "react";
import Pagination from "../components/Pagination";
import { TableSkeleton } from "../components/TableSkeleton";

const ITEMS_PER_PAGE = 10;

function daysAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "task_earnings", label: "Task Earnings" },
  { value: "referral_commission", label: "Referral Commission" },
];

export default function AdminBalanceLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateFilter, setDateFilter] = useState("");

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ uid: "all", page, limit: String(ITEMS_PER_PAGE) });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (dateFilter) {
        params.set("startDate", dateFilter);
        params.set("endDate", dateFilter);
      }
      const res = await fetch(`/api/user/balance-logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, page, dateFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleExport = async () => {
    const params = new URLSearchParams({ uid: "all" });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (dateFilter) {
      params.set("startDate", dateFilter);
      params.set("endDate", dateFilter);
    }
    const res = await fetch(`/api/user/balance-logs/export?${params}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `balance-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const badgeForType = (type) => {
    const map = {
      deposit: { label: "CREDIT", class: "bg-blue-50 text-blue-600" },
      withdrawal: { label: "DEBIT", class: "bg-red-50 text-red-600" },
      task_earnings: { label: "EARNED", class: "bg-emerald-50 text-emerald-600" },
      referral_commission: { label: "REFERRAL", class: "bg-purple-50 text-purple-600" },
    };
    return map[type] || { label: type, class: "bg-slate-100 text-slate-600" };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Balance Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Audit trail for all balance changes</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="p-4 flex flex-wrap items-center gap-3">
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
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
          />
          <span className="text-xs text-slate-400">{total} records</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No records found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Balance</th>
                  <th className="py-4 px-6">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map((log) => {
                  const badge = badgeForType(log.type);
                  const isPositive = Number(log.amount) >= 0;
                  return (
                    <tr key={log._id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900">{log.email || log.uid?.slice(0, 12)}</div>
                        <div className="text-xs text-slate-400 font-mono">{log.uid?.slice(0, 16)}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-500">
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-slate-400">{daysAgo(log.createdAt)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className={`py-4 px-6 font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                        {isPositive ? "+" : ""}${formatMoney(Math.abs(log.amount))}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">
                        ${formatMoney(log.balanceBefore)} → ${formatMoney(log.balanceAfter)}
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-xs truncate">{log.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
