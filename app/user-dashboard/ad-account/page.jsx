"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import { RefreshCw, DollarSign, TrendingUp, Target, Wallet, AlertTriangle, CheckCircle, XCircle, BarChart3 } from "lucide-react";

export default function AdAccountsPage() {
  const { user, loading } = useAuth();
  const [adAccounts, setAdAccounts] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, totalBudget: 0, totalSpent: 0, remainingBudget: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const loadAdAccounts = useCallback(async () => {
    if (!user?.uid) { setIsLoading(false); return; }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/user/ad-accounts?uid=${encodeURIComponent(user.uid)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAdAccounts(data.adAccounts || []);
        setSummary(data.summary || { total: 0, active: 0, totalBudget: 0, totalSpent: 0, remainingBudget: 0 });
      } else {
        throw new Error(data.message || "Failed to load");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadAdAccounts();
  }, [loadAdAccounts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/meta-api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-spend" }),
      });
      const data = await res.json();
      if (data.success) {
        await loadAdAccounts();
      }
    } catch {}
    setRefreshing(false);
  };

  const handleTopUp = (account) => {
    setSelectedAccount(account);
    const modal = document.getElementById("topup-modal");
    if (modal) modal.classList.remove("hidden");
  };

  const closeTopUp = () => {
    setSelectedAccount(null);
    const modal = document.getElementById("topup-modal");
    if (modal) modal.classList.add("hidden");
  };

  const filteredAccounts = adAccounts.filter((acc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return acc.name?.toLowerCase().includes(q) || acc.accountId?.toLowerCase().includes(q);
  });

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "N/A";
    const diff = Date.now() - new Date(dateString).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return new Date(dateString).toLocaleDateString();
  };

  if (loading || isLoading) {
    return <div className="max-w-7xl mx-auto px-6 py-10 text-slate-500 font-medium">Loading Ad Accounts...</div>;
  }

  const spendPct = summary.totalBudget > 0 ? Math.min((summary.totalSpent / summary.totalBudget) * 100, 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Ad Accounts</h1>
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-[#E05305] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#c84a04] transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Spend Data"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Total Accounts</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Target size={18} />
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{summary.total}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">Number of ad accounts</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Active Accounts</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{summary.active}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Currently active accounts</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Total Ad Spend</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <BarChart3 size={18} />
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900">${formatMoney(summary.totalSpent)}</div>
          <div className="text-xs text-purple-600 font-medium mt-1">Lifetime ad spend</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-amber-500/20 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-amber-700">Remaining Budget</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Wallet size={18} />
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900">${formatMoney(summary.remainingBudget)}</div>
          <div className="text-xs text-amber-700 font-semibold bg-amber-50/60 px-2 py-0.5 rounded w-max mt-1">Available ad budget</div>
          {spendPct > 80 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={12} />
              Budget nearly exhausted
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {summary.total > 0 && (
              <span className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${summary.totalSpent / summary.totalBudget < 0.8 ? "bg-emerald-400" : "bg-amber-400"}`} />
                {Math.round(spendPct)}% budget used
              </span>
            )}
            <span>{filteredAccounts.length} account{filteredAccounts.length !== 1 && "s"}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200/60">
                <th className="py-3.5 px-4 font-semibold text-slate-600">Name</th>
                <th className="py-3.5 px-4 font-semibold text-slate-600">Account ID</th>
                <th className="py-3.5 px-4 font-semibold text-slate-600">Status</th>
                <th className="py-3.5 px-4 font-semibold text-slate-600">Budget</th>
                <th className="py-3.5 px-4 font-semibold text-slate-600">Spent (This Month)</th>
                <th className="py-3.5 px-4 font-semibold text-slate-600">Sync Status</th>
                <th className="py-3.5 px-4 font-semibold text-slate-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredAccounts.length ? (
                filteredAccounts.map((account) => {
                  const budgetLeft = Number(account.budget || 0) - Number(account.spent || 0);
                  const usagePct = account.budget > 0 ? Math.min((account.spent / account.budget) * 100, 100) : 0;
                  const isNearLimit = usagePct > 85;

                  return (
                    <tr key={account._id} className={`hover:bg-slate-50/40 transition ${isNearLimit ? "bg-red-50/30" : ""}`}>
                      <td className="py-4 px-4 font-medium text-slate-900 max-w-[240px] truncate">
                        <div className="flex items-center gap-2">
                          {account.name || "Unnamed Account"}
                          {isNearLimit && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                        </div>
                        {account.lastInsights && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span>CTR: {account.lastInsights.ctr}%</span>
                            <span>CPC: ${formatMoney(account.lastInsights.cpc)}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-blue-600 hover:underline cursor-pointer">
                        {account.metaAccountId || account.accountId}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          account.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                            : account.status === "paused"
                            ? "bg-amber-50 text-amber-700 border-amber-200/50"
                            : "bg-slate-100 text-slate-600 border-slate-200/50"
                        }`}>
                          {account.status || "active"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900">${formatMoney(account.budget)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">${formatMoney(account.spent)}</span>
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePct > 90 ? "bg-red-500" : usagePct > 70 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatMoney(budgetLeft)} remaining
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          {account.syncStatus === "synced" ? (
                            <CheckCircle size={14} className="text-emerald-500" />
                          ) : account.syncStatus === "error" ? (
                            <XCircle size={14} className="text-red-500" title={account.syncError || ""} />
                          ) : (
                            <AlertTriangle size={14} className="text-amber-400" />
                          )}
                          <span className="text-xs text-slate-500">
                            {formatRelativeTime(account.lastSyncedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleTopUp(account)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
                          >
                            <DollarSign size={13} /> Top Up
                          </button>
                          <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Target size={36} className="text-slate-300" />
                      <p className="text-slate-500 font-medium">No ad accounts found</p>
                      <p className="text-xs text-slate-400">Contact admin to get ad accounts assigned to you</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Up Modal */}
      <div id="topup-modal" className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-900">Top Up Budget</h3>
            <button onClick={closeTopUp} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {selectedAccount && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Account</span>
                  <span className="font-medium text-slate-900">{selectedAccount.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Current Budget</span>
                  <span className="font-medium text-slate-900">${formatMoney(selectedAccount.budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Spent So Far</span>
                  <span className="font-medium text-slate-900">${formatMoney(selectedAccount.spent)}</span>
                </div>
                {selectedAccount.lastInsights && (
                  <>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Impressions: {selectedAccount.lastInsights.impressions?.toLocaleString()}</span>
                      <span>Clicks: {selectedAccount.lastInsights.clicks?.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Additional Budget ($)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="Enter amount..."
                className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              </div>

              <p className="text-xs text-slate-400">
                Top-up requests are sent to admin for approval. The budget will be updated once approved.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeTopUp}
                  className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    closeTopUp();
                    window.location.href = "/user-dashboard/deposits";
                  }}
                  className="flex-1 bg-[#E05305] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#c84a04] transition"
                >
                  Go to Deposit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
