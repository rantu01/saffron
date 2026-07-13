"use client";

import { useEffect, useState, useCallback } from "react";
import { Crown, Search, Check, X, Lock, Unlock, ShieldOff, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

const VIP_TIERS = [
  { level: 1, name: "VIP 1", label: "Bronze", unlockBalance: 0 },
  { level: 2, name: "VIP 2", label: "Silver", unlockBalance: 1500 },
  { level: 3, name: "VIP 3", label: "Gold", unlockBalance: 5000 },
  { level: 4, name: "VIP 4", label: "Diamond", unlockBalance: 10000 },
];

const REQ_LIMIT = 10;
const USER_LIMIT = 15;

const tierInfo = (l) => VIP_TIERS.find((t) => t.level === Number(l)) || VIP_TIERS[0];
const tierName = (l) => tierInfo(l).name;
const tierLabel = (l) => tierInfo(l).label;

const formatMoney = (val) => {
  const n = Number(val || 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function LevelBadge({ level, dim = false }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${dim ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"}`}>
      <Crown size={12} />
      {tierName(level)} {tierLabel(level) ? `· ${tierLabel(level)}` : ""}
    </span>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50"
        >
          Previous
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function VipLevelsPage() {
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const [requests, setRequests] = useState([]);
  const [reqTotal, setReqTotal] = useState(0);
  const [reqPage, setReqPage] = useState(1);

  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setReqPage(1);
    setUserPage(1);
  }, [debounced, tab]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vip/requests?search=${encodeURIComponent(debounced)}&page=${reqPage}&limit=${REQ_LIMIT}&status=pending`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
        setReqTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [debounced, reqPage]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vip/users?search=${encodeURIComponent(debounced)}&page=${userPage}&limit=${USER_LIMIT}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setUserTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [debounced, userPage]);

  useEffect(() => {
    if (tab === "pending") loadRequests();
    else loadUsers();
  }, [tab, loadRequests, loadUsers]);

  const resolveRequest = async (id, action) => {
    const res = await fetch(`/api/admin/vip/requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      Swal.fire({ icon: "error", title: "Failed", text: data.message || "Could not process request." });
      return;
    }
    Swal.fire({ icon: "success", title: action === "approve" ? "VIP Level Approved" : "Request Rejected", timer: 1500, showConfirmButton: false });
    loadRequests();
  };

  const setLevel = async (uid, level, action, label) => {
    const res = await fetch(`/api/admin/vip/users/${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, action }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      Swal.fire({ icon: "error", title: "Failed", text: data.message || "Could not update level." });
      return;
    }
    Swal.fire({ icon: "success", title: label, timer: 1500, showConfirmButton: false });
    loadUsers();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Crown className="w-7 h-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold ">VIP Levels</h1>
          <p className="text-sm text-slate-500">Higher VIP levels require admin approval. VIP 1 is unlocked by default.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-200">
        {[
          { id: "pending", label: `Pending Requests (${reqTotal})` },
          { id: "users", label: "All Users" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.id ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Name, Email, UID or Group"
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-10">Loading…</div>
      ) : tab === "pending" ? (
        requests.length === 0 ? (
          <div className="text-center text-slate-400 py-10">No pending VIP upgrade requests.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r._id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{r.displayName || "—"}</p>
                  <p className="text-xs text-slate-500">UID: {r.uid}</p>
                  <p className="text-xs text-slate-500">{r.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <LevelBadge level={r.fromLevel} dim />
                    <span className="text-slate-400">→</span>
                    <LevelBadge level={r.toLevel} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => resolveRequest(r._id, "approve")} className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={() => resolveRequest(r._id, "reject")} className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
            <Pagination page={reqPage} totalPages={Math.max(1, Math.ceil(reqTotal / REQ_LIMIT))} onChange={(p) => setReqPage(p)} />
          </div>
        )
      ) : users.length === 0 ? (
        <div className="text-center text-slate-400 py-10">No users found.</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const qualifiesHigher = u.eligibleLevel > u.vipLevel;
            return (
              <div key={u.uid} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{u.displayName || "—"}</p>
                    <p className="text-xs text-slate-500">UID: {u.uid}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                    {u.currentGroup?.groupName && (
                      <p className="text-xs text-slate-400 mt-0.5">Group: {u.currentGroup.groupName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.status === "unlocked" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
                      {u.status === "unlocked" ? "Unlocked" : "Locked"}
                    </span>
                    <LevelBadge level={u.vipLevel} />
                    <span className="text-slate-400 text-xs">eligible: <LevelBadge level={u.eligibleLevel} dim /></span>
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>Balance: USDCIT {formatMoney(u.balance)}</p>
                    {qualifiesHigher ? (
                      <p className="text-amber-600 font-medium">
                        Qualifies for {tierName(u.eligibleLevel)} (needs ≥ USDCIT {formatMoney(tierInfo(u.eligibleLevel).unlockBalance)})
                      </p>
                    ) : (
                      <p>Current level matches eligibility.</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {qualifiesHigher && (
                      <button onClick={() => setLevel(u.uid, u.eligibleLevel, "unlock", "VIP Level Unlocked")} className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                        <Unlock size={14} /> Approve Upgrade
                      </button>
                    )}
                    <button onClick={() => setLevel(u.uid, 1, "revoke", "VIP Level Revoked")} disabled={u.vipLevel <= 1} className="inline-flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40">
                      <ShieldOff size={14} /> Revoke
                    </button>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v) setLevel(u.uid, v, "set", `VIP Level set to ${tierName(v)}`);
                        e.target.value = "";
                      }}
                      className="border border-slate-300 rounded-lg text-sm px-2 py-1.5"
                    >
                      <option value="">Set level…</option>
                      {VIP_TIERS.map((t) => (
                        <option key={t.level} value={t.level}>Lock/Unlock to {t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
          <Pagination page={userPage} totalPages={Math.max(1, Math.ceil(userTotal / USER_LIMIT))} onChange={(p) => setUserPage(p)} />
        </div>
      )}
    </div>
  );
}
