"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { BarChart3, TrendingUp, DollarSign, Users, Download, Calendar, FileText, RefreshCw, Target, Wallet } from "lucide-react";

const ITEMS_PER_PAGE = 20;

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [financial, setFinancial] = useState({ rows: [], summary: null });
  const [userActivity, setUserActivity] = useState({ rows: [], total: 0 });
  const [adSpend, setAdSpend] = useState({ rows: [], summary: null });
  const [finPage, setFinPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [adPage, setAdPage] = useState(1);

  const [financialPeriod, setFinancialPeriod] = useState("daily");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [exporting, setExporting] = useState(false);

  const getDefaultRange = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reports?type=overview");
      const data = await res.json();
      if (data.success) setOverview(data.data);
    } catch {}
  }, []);

  const loadFinancial = useCallback(async (period, start, end) => {
    try {
      let url = `/api/admin/reports?type=financial&period=${period}`;
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setFinancial(data.data);
    } catch {}
  }, []);

  const loadUserActivity = useCallback(async (start, end) => {
    try {
      let url = "/api/admin/reports?type=users";
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setUserActivity(data.data);
    } catch {}
  }, []);

  const loadAdSpend = useCallback(async (start, end) => {
    try {
      let url = "/api/admin/reports?type=ad-spend";
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setAdSpend(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    const range = getDefaultRange();
    Promise.all([
      loadOverview(),
      loadFinancial(financialPeriod, range.start, range.end),
      loadUserActivity(range.start, range.end),
      loadAdSpend(range.start, range.end),
    ]).finally(() => setLoading(false));
  }, [loadOverview, loadFinancial, loadUserActivity, loadAdSpend, financialPeriod]);

  const handleRefresh = () => {
    setLoading(true);
    const range = dateRange.start && dateRange.end ? dateRange : getDefaultRange();
    Promise.all([
      loadOverview(),
      loadFinancial(financialPeriod, range.start, range.end),
      loadUserActivity(range.start, range.end),
      loadAdSpend(range.start, range.end),
    ]).finally(() => setLoading(false));
  };

  const handleExport = async (type, format) => {
    setExporting(true);
    const range = dateRange.start && dateRange.end ? dateRange : getDefaultRange();
    try {
      let url = `/api/admin/reports/export?type=${type}&format=${format}&period=${financialPeriod}&startDate=${range.start}&endDate=${range.end}`;
      const res = await fetch(url);

      if (format === "csv") {
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${type}_report_${range.start}_to_${range.end}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        await Swal.fire({ icon: "success", title: "CSV downloaded", timer: 1000, showConfirmButton: false });
      } else if (format === "pdf") {
        const html = await res.text();
        const win = window.open("", "_blank");
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Export failed", text: err.message });
    } finally {
      setExporting(false);
    }
  };

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "users", label: "Users", icon: Users },
    // { id: "ad-spend", label: "Ad Spend", icon: Target },
  ];

  const range = dateRange.start && dateRange.end ? dateRange : getDefaultRange();

  const StatCard = ({ label, value, sub, icon: Icon, color }) => (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`p-2 ${color || "bg-slate-50 text-slate-600"} rounded-lg`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );

  if (loading && !overview) {
    return <div className="text-slate-500 py-10 text-center">Loading reports...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Comprehensive business insights and exportable reports</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={dateRange.start || range.start}
              onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
              className="border-0 bg-transparent text-sm w-[130px] focus:outline-none"
            />
            <span className="text-slate-300">—</span>
            <input
              type="date"
              value={dateRange.end || range.end}
              onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
              className="border-0 bg-transparent text-sm w-[130px] focus:outline-none"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50 transition"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === t.id ? "bg-[#E05305] text-white shadow" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && overview && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={overview.totalUsers} sub="Registered accounts" icon={Users} color="bg-blue-50 text-blue-600" />
            <StatCard label="Approved Deposits" value={`$${formatMoney(overview.approvedDepositsTotal)}`} sub={`${overview.approvedDepositsCount} transactions`} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
            <StatCard label="Approved Withdrawals" value={`$${formatMoney(overview.approvedWithdrawalsTotal)}`} sub={`${overview.approvedWithdrawalsCount} transactions`} icon={Wallet} color="bg-purple-50 text-purple-600" />
            <StatCard label="Net Revenue" value={`$${formatMoney(overview.netRevenue)}`} sub="Deposits - Withdrawals" icon={DollarSign} color={overview.netRevenue >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Tasks Completed" value={overview.tasksCompleted} sub={`${overview.tasksPending} pending`} icon={BarChart3} color="bg-amber-50 text-amber-600" />
            <StatCard label="Ad Accounts" value={overview.adAccounts} sub="Total managed" icon={Target} color="bg-sky-50 text-sky-600" />
            <StatCard label="Total Budget" value={`$${formatMoney(overview.totalBudget)}`} sub="Across all accounts" icon={DollarSign} color="bg-indigo-50 text-indigo-600" />
            <StatCard label="Total Spent" value={`$${formatMoney(overview.totalSpent)}`} sub={`${overview.totalBudget > 0 ? ((overview.totalSpent / overview.totalBudget) * 100).toFixed(1) : 0}% utilization`} icon={TrendingUp} color="bg-rose-50 text-rose-600" />
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === "financial" && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Period:</span>
              {["daily", "weekly", "monthly"].map((p) => (
                <button
                  key={p}
                  onClick={() => { setFinancialPeriod(p); setFinPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    financialPeriod === p ? "bg-[#E05305] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("financial", "csv")}
                disabled={exporting}
                className="border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={() => handleExport("financial", "pdf")}
                disabled={exporting}
                className="border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileText size={13} /> PDF
              </button>
            </div>
          </div>

          {financial.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-medium">Total Deposits</p>
                <p className="text-xl font-bold text-emerald-900">${formatMoney(financial.summary.totalDeposits)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs text-red-600 font-medium">Total Withdrawals</p>
                <p className="text-xl font-bold text-red-900">${formatMoney(financial.summary.totalWithdrawals)}</p>
              </div>
              <div className={`border rounded-xl p-4 ${financial.summary.net >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                <p className={`text-xs font-medium ${financial.summary.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>Net Revenue</p>
                <p className={`text-xl font-bold ${financial.summary.net >= 0 ? "text-emerald-900" : "text-red-900"}`}>
                  ${formatMoney(financial.summary.net)}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Deposits</th>
                    <th className="py-3 px-4">Deposit Count</th>
                    <th className="py-3 px-4">Withdrawals</th>
                    <th className="py-3 px-4">Withdrawal Count</th>
                    <th className="py-3 px-4">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {financial.rows.length > 0 ? financial.rows.slice((finPage - 1) * ITEMS_PER_PAGE, finPage * ITEMS_PER_PAGE).map((r, i) => (
                    <tr key={r.date || i} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-medium">{r.date}</td>
                      <td className="py-3 px-4 text-emerald-600 font-medium">${formatMoney(r.deposits)}</td>
                      <td className="py-3 px-4">{r.depositCount}</td>
                      <td className="py-3 px-4 text-red-600 font-medium">${formatMoney(r.withdrawals)}</td>
                      <td className="py-3 px-4">{r.withdrawalCount}</td>
                      <td className={`py-3 px-4 font-medium ${(r.deposits - r.withdrawals) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        ${formatMoney(r.deposits - r.withdrawals)}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">No financial data in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {financial.rows.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setFinPage((p) => Math.max(1, p - 1))}
                disabled={finPage <= 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {finPage} of {Math.ceil(financial.rows.length / ITEMS_PER_PAGE)}</span>
              <button
                onClick={() => setFinPage((p) => Math.min(Math.ceil(financial.rows.length / ITEMS_PER_PAGE), p + 1))}
                disabled={finPage >= Math.ceil(financial.rows.length / ITEMS_PER_PAGE)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-slate-500">{userActivity.total} users in selected period</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("users", "csv")}
                disabled={exporting}
                className="border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={() => handleExport("users", "pdf")}
                disabled={exporting}
                className="border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileText size={13} /> PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Total Earned</th>
                    <th className="py-3 px-4">Tasks</th>
                    <th className="py-3 px-4">Deposits</th>
                    <th className="py-3 px-4">Withdrawals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {userActivity.rows.length > 0 ? userActivity.rows.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE).map((u, i) => (
                    <tr key={u.uid || i} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="font-medium text-slate-900 truncate">{u.displayName || u.email || u.uid?.slice(0, 16)}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.accountType === "demo" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                          {u.accountType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">${formatMoney(u.balance)}</td>
                      <td className="py-3 px-4">${formatMoney(u.totalEarned)}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{u.tasksCompleted}</span>
                        <span className="text-xs text-slate-400 ml-1">(+${formatMoney(u.tasksEarned)})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{u.deposits}</span>
                        <span className="text-xs text-slate-400 ml-1">($${formatMoney(u.depositTotal)})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{u.withdrawals}</span>
                        <span className="text-xs text-slate-400 ml-1">($${formatMoney(u.withdrawalTotal)})</span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400">No user activity in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {userActivity.rows.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                disabled={userPage <= 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {userPage} of {Math.ceil(userActivity.rows.length / ITEMS_PER_PAGE)}</span>
              <button
                onClick={() => setUserPage((p) => Math.min(Math.ceil(userActivity.rows.length / ITEMS_PER_PAGE), p + 1))}
                disabled={userPage >= Math.ceil(userActivity.rows.length / ITEMS_PER_PAGE)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ad Spend Tab */}
      {activeTab === "ad-spend" && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              {adSpend.summary && (
                <>
                  <span className="text-sm text-slate-500">{adSpend.summary.totalAccounts} accounts</span>
                  <span className="text-sm text-slate-500">Budget: <strong>${formatMoney(adSpend.summary.totalBudget)}</strong></span>
                  <span className="text-sm text-slate-500">Spent: <strong>${formatMoney(adSpend.summary.totalSpent)}</strong></span>
                  <span className="text-sm text-slate-500">Utilization: <strong className={adSpend.summary.utilization > 80 ? "text-red-600" : "text-emerald-600"}>{adSpend.summary.utilization.toFixed(1)}%</strong></span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("ad-spend", "csv")}
                disabled={exporting}
                className="border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={() => handleExport("ad-spend", "pdf")}
                disabled={exporting}
                className="border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileText size={13} /> PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Budget</th>
                    <th className="py-3 px-4">Spent</th>
                    <th className="py-3 px-4">Utilization</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Last Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {adSpend.rows.length > 0 ? adSpend.rows.slice((adPage - 1) * ITEMS_PER_PAGE, adPage * ITEMS_PER_PAGE).map((a, i) => {
                    const util = a.budget > 0 ? (a.spent / a.budget) * 100 : 0;
                    return (
                      <tr key={a._id || i} className="hover:bg-slate-50/40">
                        <td className="py-3 px-4 max-w-[200px]">
                          <p className="font-medium text-slate-900 truncate">{a.name}</p>
                          <p className="text-xs font-mono text-blue-600 truncate">{a.metaAccountId || a.accountId}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            a.status === "active" ? "bg-emerald-50 text-emerald-700" :
                            a.status === "paused" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                          }`}>{a.status}</span>
                        </td>
                        <td className="py-3 px-4 font-medium">${formatMoney(a.budget)}</td>
                        <td className="py-3 px-4">${formatMoney(a.spent)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${util > 90 ? "bg-red-500" : util > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(util, 100)}%` }} />
                            </div>
                            <span className={`text-xs font-medium ${util > 90 ? "text-red-600" : util > 70 ? "text-amber-600" : "text-emerald-600"}`}>
                              {util.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 truncate max-w-[140px]">{a.email || "-"}</td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {a.lastSyncedAt ? new Date(a.lastSyncedAt).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400">No ad spend data in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {adSpend.rows.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setAdPage((p) => Math.max(1, p - 1))}
                disabled={adPage <= 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {adPage} of {Math.ceil(adSpend.rows.length / ITEMS_PER_PAGE)}</span>
              <button
                onClick={() => setAdPage((p) => Math.min(Math.ceil(adSpend.rows.length / ITEMS_PER_PAGE), p + 1))}
                disabled={adPage >= Math.ceil(adSpend.rows.length / ITEMS_PER_PAGE)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
