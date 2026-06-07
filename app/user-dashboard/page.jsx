"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/Component/Auth/AuthProvider";

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [dashboard, setDashboard] = useState({ availableBalance: 0, tasks: [] });
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search state for Ad Accounts / Tasks
  const [searchQuery, setSearchQuery] = useState("");

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return '0.00';
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "N/A";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Less than a minute ago";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getCurrentMonthRange = () => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "short" });
    const year = now.getFullYear();
    const start = `${month} 01`;
    const end = `${month} ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}, ${year}`;
    return `${start} - ${end}`;
  };

  useEffect(() => {
    async function loadDashboard() {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        const [dashboardRes, depositsRes, withdrawalsRes] = await Promise.all([
          fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/user/deposit?uid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/user/withdrawal?uid=${encodeURIComponent(user.uid)}`),
        ]);

        const dashboardResult = await dashboardRes.json();
        const depositsResult = await depositsRes.json();
        const withdrawalsResult = await withdrawalsRes.json();

        if (!dashboardRes.ok || !dashboardResult.success) {
          throw new Error(dashboardResult.message || "Failed to load dashboard.");
        }

        setDashboard(dashboardResult.dashboard);
        setDeposits(depositsResult.deposits || []);
        setWithdrawals(withdrawalsResult.withdrawals || []);
      } catch (err) {
        setError(err.message || "Failed to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [user?.uid]);

  if (loading || isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-10 text-slate-600 font-medium">Loading dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">User Dashboard</h1>
        <p className="mt-2 text-slate-600">Please login to view your dashboard.</p>
      </div>
    );
  }

  // Calculate dynamic data safely
  const completedTasks = (dashboard.tasks || []).filter(t => t.status === 'completed');
  const totalEarned = completedTasks.reduce((s, t) => s + Number(t.earnedAmount ?? t.reward ?? 0), 0);

  // Filter tasks or mock ad-accounts based on search
  const filteredTasks = (dashboard.tasks || []).filter(task => 
    task.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8  min-h-screen">
      {/* Header section from image */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Welcome back</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-0.5">
            {user.displayName || user.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-sm text-slate-600 mt-1">Manage your accounts, balances and requests efficiently.</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-200 text-sm">{error}</div>}
      </div>

      {/* Top 4 Stats Cards (Matching the image layout structure but white background) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        
        {/* Card 1: Wallet Balance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wallet Balance</span>
              <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-4">${formatMoney(dashboard.availableBalance)}</div>
          </div>
          <div className="mt-4 text-xs font-medium text-blue-600 bg-blue-50/50 py-1.5 px-3 rounded-md w-max">
            Available USD
          </div>
        </div>

        {/* Card 2: USD Rate / Account Type */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">USD Rate / Type</span>
              <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            {/* Kept dynamic details while implementing image look */}
            <div className="text-3xl font-bold text-slate-900 mt-4">{formatMoney(dashboard.usdRate || 129)}</div>
          </div>
          <div className="mt-4 text-xs font-medium text-emerald-600 bg-emerald-50/50 py-1.5 px-3 rounded-md w-max capitalize">
            {dashboard.accountType || (dashboard.isDemoAccount ? 'Demo Account' : 'BDT to USD')}
          </div>
        </div>

        {/* Card 3: Completed / Total Earnings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Earned</span>
              <span className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-4">${formatMoney(totalEarned)}</div>
          </div>
          <div className="mt-4 text-xs font-medium text-purple-600 bg-purple-50/50 py-1.5 px-3 rounded-md w-max">
            {getCurrentMonthRange()}
          </div>
        </div>

        {/* Card 4: Remaining Budget (Special high priority card like image) */}
        <div className="bg-white rounded-2xl border-2 border-amber-500/30 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-5 -mt-5"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Remaining Tasks / Budget</span>
              <span className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-4">
              {dashboard.tasks ? dashboard.tasks.length - completedTasks.length : 0} <span className="text-lg text-slate-400 font-normal">Left</span>
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-amber-700 bg-amber-50 py-1.5 px-3 rounded-md w-max">
            Remaining Actions
          </div>
        </div>
      </div>

      {/* Account Freeze / Alert Notice */}
      {dashboard.accountStatus === 'frozen' && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-sm text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div>
            <span className="font-semibold">Account Frozen:</span> {dashboard.freezeReason || 'Balance requirement not met.'}
            {dashboard.freezeThreshold > 0 && ` Minimum balance required: $${formatMoney(dashboard.freezeThreshold)}`}
          </div>
        </div>
      )}

      {/* Main Section: Data Table Area (Exactly like the image structure but clean white) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
        
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Dynamic Accounts / Tasks</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status updates and balance management</p>
          </div>
          <button onClick={() => router.push("/user-dashboard/deposits")} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition shadow-sm self-start sm:self-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Request New Account
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search accounts or tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm w-full sm:w-auto justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Status Filter
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Name / Title</th>
                <th className="py-4 px-6">Account ID / ID</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Reward / Budget</th>
                <th className="py-4 px-6">Last Refreshed</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredTasks.length ? (
                filteredTasks.map((task) => {
                  const reward = Number(task.earnedAmount ?? task.reward ?? 0);
                  const progressPct = task.reward > 0 ? Math.min(Math.round((reward / Number(task.reward)) * 100), 100) : 0;
                  return (
                  <tr key={task._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-semibold text-slate-900 max-w-xs truncate">
                      {task.title || "Untitled Task"}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-blue-600 hover:underline cursor-pointer">
                      {task._id ? task._id.substring(0, 15) : "-"}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {task.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">${formatMoney(reward)}</div>
                      {task.reward > 0 && (
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-red-500 h-full rounded-full" style={{ width: `${progressPct}%` }}></div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {formatRelativeTime(task.updatedAt || task.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => router.push("/user-dashboard/deposits")} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm">
                          Top Up
                        </button>
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">No matching accounts or tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid for History Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Deposits log box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Recent Deposits</h3>
            <span onClick={() => router.push("/user-dashboard/deposits")} className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
          </div>
          <div className="space-y-3">
            {deposits.length ? (
              deposits.slice(0, 3).map((deposit) => (
                <div key={deposit._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 transition hover:bg-slate-100/50">
                  <div>
                    <p className="font-bold text-slate-900">${formatMoney(deposit.amount)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(deposit.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    deposit.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                    deposit.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {deposit.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 py-2">No deposits registered yet.</p>
            )}
          </div>
        </div>

        {/* Recent Withdrawals log box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Recent Withdrawals</h3>
            <span onClick={() => router.push("/user-dashboard/withdrawals")} className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
          </div>
          <div className="space-y-3">
            {withdrawals.length ? (
              withdrawals.slice(0, 3).map((withdrawal) => (
                <div key={withdrawal._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 transition hover:bg-slate-100/50">
                  <div>
                    <p className="font-bold text-slate-900">${formatMoney(withdrawal.amount)}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-[180px]">
                      {withdrawal.walletAddress}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    withdrawal.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                    withdrawal.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {withdrawal.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 py-2">No withdrawals registered yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}