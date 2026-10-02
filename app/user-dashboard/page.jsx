"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import {
  Eye, EyeOff, TrendingUp, TrendingDown, ChevronRight,
  CheckCircle2, Clock, AlertCircle, Activity,
  Calendar, Award, Target, BarChart3,
  Wallet, PlusCircle, Send, MessageCircle, Gift,
} from "lucide-react";

const GOLD = "#FBBF24";

function formatMoney(val) {
  const n = Number(val || 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTime(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatDateShort(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function getPeriodEarnings(tasks, period) {
  if (!tasks?.length) return 0;
  const now = new Date();
  let cutoff;
  if (period === "Today") {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "7 Days") {
    cutoff = new Date(now.getTime() - 7 * 86400000);
  } else {
    cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return tasks
    .filter(t => t.status === "completed" && new Date(t.createdAt) >= cutoff)
    .reduce((s, t) => s + Number(t.earnedAmount ?? t.reward ?? 0), 0);
}

/* ─── Circular Progress ─── */
function CircularProgress({ percent, size = 110, strokeWidth = 8 }) {
  const radius = Math.max(1, (size - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={GOLD} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white leading-none">{Math.round(percent)}%</span>
        <span className="text-[10px] text-slate-400 mt-1">complete</span>
      </div>
    </div>
  );
}

/* ─── Earnings Chart ─── */
function EarningsChart({ data, width = 340, height = 160 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-slate-500 text-xs">
        No data available
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const pad = { top: 10, right: 10, bottom: 28, left: 42 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;
  const pts = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * cw,
    y: pad.top + ch - ((d.value - min) / range) * ch * 0.85 - ch * 0.05,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${pad.top + ch} L${pts[0].x},${pad.top + ch} Z`;

  return (
    <div className="w-full" style={{ maxWidth: width }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxWidth: width, height: "auto" }}>
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.25" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = pad.top + ch * (1 - r);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x={pad.left - 5} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="Arial, sans-serif">
                ${Math.round(max * r + min * (1 - r))}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          if (data.length > 10 && i % 2 !== 0) return null;
          const x = pad.left + (i / Math.max(data.length - 1, 1)) * cw;
          return (
            <text key={i} x={x} y={height - 5} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="Arial, sans-serif">
              {d.label}
            </text>
          );
        })}
        <path d={areaPath} fill="url(#cg)" />
        <path d={linePath} fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={GOLD} stroke="#121212" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  );
}

/* ─── User Account Card ─── */
function UserAccountCard({ profile, user }) {
  const displayName = profile?.username || profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const initials = displayName.charAt(0).toUpperCase();
  const accountId = profile?.referralCode || user?.uid?.slice(0, 10) || "----";

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-4 flex items-center gap-3.5">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0 flex items-center justify-center text-slate-900 font-bold text-lg">
        {profile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-bold text-white truncate">{displayName}</h2>
        <p className="text-[11px] text-slate-400 truncate">{email}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
          <span className="text-[9px] text-slate-500 font-mono">{accountId}</span>
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />
    </div>
  );
}

/* ─── System Status ─── */
function SystemStatus() {
  return (
    <div className="mx-4 mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-medium text-emerald-400">All systems operational</span>
      </div>
      <ChevronRight size={14} className="text-emerald-400/50" />
    </div>
  );
}

/* ─── Balance Card ─── */
function BalanceCard({ balance, onToggleVisible, isVisible }) {
  const todayChange = 12.50;
  const changePercent = 2.4;

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#1a1a1a] via-[#161616] to-[#121212] p-5 relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-amber-500/[0.07] rounded-full" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/[0.05] rounded-full" />
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Available Balance</span>
          <button onClick={onToggleVisible} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
            {isVisible ? <Eye size={16} className="text-slate-400" /> : <EyeOff size={16} className="text-slate-400" />}
          </button>
        </div>
        <div className="text-3xl font-bold text-white mt-1 tracking-tight">
          {isVisible ? `$${formatMoney(balance)}` : "••••••"}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400">
            <TrendingUp size={12} /> +{formatMoney(todayChange)} today
          </span>
          <span className="text-[10px] font-medium text-emerald-400">
            (+{changePercent}%)
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-900 font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]">
            Add Fund
          </button>
          <button className="flex-1 border border-white/10 hover:border-white/20 text-white font-medium text-sm py-3 rounded-xl transition-colors bg-white/[0.03]">
            History
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Stats Cards ─── */
function StatsCards({ tasks }) {
  const today = getPeriodEarnings(tasks, "Today");
  const week = getPeriodEarnings(tasks, "7 Days");
  const month = getPeriodEarnings(tasks, "30 Days");

  const stats = [
    { label: "Today", value: `$${formatMoney(today)}`, change: "+0%", positive: true, icon: Wallet, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Week", value: `$${formatMoney(week)}`, change: "+0%", positive: true, icon: Calendar, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Month", value: `$${formatMoney(month)}`, change: "+0%", positive: true, icon: Award, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mt-4 px-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="rounded-xl bg-[#1a1a1a] border border-white/[0.06] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${stat.bg}`}>
                <Icon size={12} className={stat.color} />
              </div>
            </div>
            <div className="text-base font-bold text-white">{stat.value}</div>
            <div className={`text-[10px] font-medium mt-0.5 ${stat.positive ? "text-emerald-400" : "text-red-400"}`}>
              {stat.change}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Quick Actions ─── */
function QuickActions({ onNavigate }) {
  const actions = [
    { label: "My Tasks", desc: "View tasks", icon: Target, href: "/user-dashboard/tasks" },
    { label: "Add Fund", desc: "Deposit", icon: PlusCircle, href: "/user-dashboard/deposits" },
    { label: "Withdraw", desc: "Withdraw", icon: Send, href: "/user-dashboard/withdrawals" },
    { label: "Support", desc: "Help", icon: MessageCircle, href: "/user-dashboard/chat" },
  ];

  return (
    <div className="mt-4 px-4">
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => onNavigate(action.href)}
              className="rounded-xl bg-[#1a1a1a] border border-white/[0.06] p-3 flex flex-col items-center gap-1.5 hover:border-amber-500/20 transition-colors active:scale-[0.97]"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Icon size={16} className="text-amber-400" />
              </div>
              <span className="text-[10px] font-semibold text-white text-center leading-tight">{action.label}</span>
              <span className="text-[9px] text-slate-500 text-center leading-tight">{action.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Task Progress Card ─── */
function TaskProgressCard({ tasks }) {
  const completedCount = tasks?.filter(t => t.status === "completed").length || 0;
  const totalCount = tasks?.length || 0;
  const percent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Target size={16} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Today's Task Progress</h3>
            <p className="text-[10px] text-slate-400">{completedCount} of {totalCount} completed</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-500" />
      </div>
      <div className="flex items-center gap-5">
        <CircularProgress percent={percent} size={90} strokeWidth={7} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-400">Progress</span>
            <span className="text-[11px] font-bold text-amber-400">{Math.round(percent)}%</span>
          </div>
          <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">{completedCount} done</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-amber-400" />
              <span className="text-[10px] text-amber-400 font-medium">{totalCount - completedCount} left</span>
            </div>
          </div>
        </div>
      </div>
      <button className="w-full mt-4 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
        Continue Tasks
      </button>
    </div>
  );
}

/* ─── Earnings Overview ─── */
function EarningsOverview({ tasks }) {
  const [filter, setFilter] = useState("Today");

  const completedTasks = tasks?.filter(t => t.status === "completed") || [];
  const chartData = useMemo(() => {
    if (!completedTasks.length) return [{ label: "No", value: 0 }];
    const now = new Date();
    let cutoff;
    if (filter === "Today") {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === "7 Days") {
      cutoff = new Date(now.getTime() - 7 * 86400000);
    } else {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const filtered = completedTasks.filter(t => new Date(t.createdAt) >= cutoff);
    const last7 = filtered.slice(0, 7).reverse();
    if (!last7.length) return [{ label: "No", value: 0 }];
    return last7.map(t => ({
      label: formatDateShort(t.createdAt),
      value: Number(t.earnedAmount || t.reward || 0),
    }));
  }, [completedTasks, filter]);

  const filters = ["Today", "7 Days", "30 Days"];

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Earnings Overview</h3>
          <BarChart3 size={14} className="text-amber-400" />
        </div>
        <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                filter === f ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-center">
        <EarningsChart data={chartData} />
      </div>
    </div>
  );
}

/* ─── Recent Activity ─── */
function RecentActivity({ records }) {
  const activities = records?.slice(0, 5) || [];

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Recent Activity</h3>
          <Activity size={14} className="text-amber-400" />
        </div>
        <span className="text-[11px] text-amber-400 font-medium cursor-pointer hover:text-amber-300">
          View all →
        </span>
      </div>
      <div className="space-y-1">
        {activities.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">No recent activity</div>
        ) : (
          activities.map((record, i) => {
            const isPositive = record.profit >= 0 || record.status === "completed";
            return (
              <div key={i} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}>
                  {isPositive ? (
                    <ArrowUpRight size={14} className="text-emerald-400" />
                  ) : (
                    <ArrowDownRight size={14} className="text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate">{record.title || "Task"}</p>
                  <p className="text-[10px] text-slate-400">{record.status || "pending"}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-[11px] font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                    {isPositive ? "+" : "-"} ${formatMoney(Math.abs(record.profit || record.totalAmount || 0))}
                  </p>
                  <p className="text-[9px] text-slate-500">{formatTime(record.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Main Dashboard Page ─── */
export default function UserDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();

  const [dashboard, setDashboard] = useState({ availableBalance: 0, frozenBalance: 0, tasks: [] });
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcomeToast(true);
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, "", cleanUrl);
      const timer = setTimeout(() => setShowWelcomeToast(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadDashboard() {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }
      try {
        setError("");
        const [dashboardRes, depositsRes, withdrawalsRes, profileRes, recordsRes] = await Promise.all([
          fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/user/deposit?uid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/user/withdrawal?uid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/user/profile?uid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/user/records?uid=${encodeURIComponent(user.uid)}`),
        ]);

        const dashboardResult = await dashboardRes.json();
        const depositsResult = await depositsRes.json();
        const withdrawalsResult = await withdrawalsRes.json();
        const profileResult = await profileRes.json();
        const recordsResult = await recordsRes.json();

        if (!dashboardRes.ok || !dashboardResult.success) {
          throw new Error(dashboardResult.message || "Failed to load dashboard.");
        }

        setDashboard(dashboardResult.dashboard);
        setDeposits(depositsResult.deposits || []);
        setWithdrawals(withdrawalsResult.withdrawals || []);
        if (profileResult?.success) {
          setProfile(profileResult.user);
        }
        if (recordsResult?.success) {
          setRecords(recordsResult.records || []);
        }
      } catch (err) {
        setError(err.message || "Failed to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [user?.uid]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#121212]">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-[#1a1a1a] rounded-2xl" />
            <div className="h-12 bg-[#1a1a1a] rounded-xl" />
            <div className="h-32 bg-[#1a1a1a] rounded-2xl" />
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-[#1a1a1a] rounded-xl" />
              ))}
            </div>
            <div className="h-44 bg-[#1a1a1a] rounded-2xl" />
            <div className="h-48 bg-[#1a1a1a] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-slate-400">Please login to view your dashboard.</p>
      </div>
    );
  }

  const balance = Number(dashboard.availableBalance || 0);
  const accountStatus = dashboard.accountStatus || "active";

  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      {/* Welcome Bonus Toast */}
      {showWelcomeToast && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
          <div className="bg-emerald-500/15 border border-emerald-500/25 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Gift size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-400">Welcome! You've received a $5 signup bonus.</p>
              <p className="text-[10px] text-emerald-300/70 mt-0.5">Check your balance to see the credit.</p>
            </div>
            <button onClick={() => setShowWelcomeToast(false)} className="text-emerald-400/50 hover:text-emerald-400 ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* User Account Card */}
      <UserAccountCard profile={profile} user={user} />

      {/* System Status */}
      <SystemStatus />

      {/* Balance Card */}
      <BalanceCard balance={balance} onToggleVisible={() => setBalanceVisible(v => !v)} isVisible={balanceVisible} />

      {/* Stats Cards */}
      <StatsCards tasks={dashboard.tasks} />

      {/* Quick Actions */}
      <QuickActions onNavigate={(href) => router.push(href)} />

      {/* Task Progress */}
      <TaskProgressCard tasks={dashboard.tasks} />

      {/* Earnings Overview */}
      <EarningsOverview tasks={dashboard.tasks} />

      {/* Recent Activity */}
      <RecentActivity records={records} />

      {/* Account Freeze Alert */}
      {accountStatus === "frozen" && (
        <div className="mx-4 mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 flex items-center gap-3 text-xs text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          <div>
            <span className="font-semibold">Account Frozen:</span> {dashboard.freezeReason || "Balance requirement not met."}
            {dashboard.freezeThreshold > 0 && ` Minimum balance required: $${formatMoney(dashboard.freezeThreshold)}`}
          </div>
        </div>
      )}
    </div>
  );
}