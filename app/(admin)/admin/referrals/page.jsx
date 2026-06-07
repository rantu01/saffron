"use client";

import { useEffect, useState } from "react";

export default function AdminReferralsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (!cancelled && data.success) setUsers(data.users || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const usersWithReferrals = users
    .filter((u) => u.inviterUid)
    .reduce((acc, u) => {
      const inviter = acc.find((i) => i.uid === u.inviterUid);
      if (inviter) {
        inviter.referredUsers.push(u);
        inviter.totalReferralEarnings += Number(u.totalDemoProfitShared || 0);
      } else {
        const parent = users.find((p) => p.uid === u.inviterUid);
        acc.push({
          uid: u.inviterUid,
          email: parent?.email || u.inviterEmail || u.inviterUid,
          referredUsers: [u],
          totalReferralEarnings: Number(u.totalDemoProfitShared || 0),
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.referredUsers.length - a.referredUsers.length);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Referral Management</h1>
      <p className="text-sm text-slate-500 mb-6">Track referrals and commission earnings across the platform</p>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : usersWithReferrals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No referral activity yet.
        </div>
      ) : (
        <div className="space-y-4">
          {usersWithReferrals.map((inviter) => (
            <div key={inviter.uid} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{inviter.email}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">UID: {inviter.uid.slice(0, 20)}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-600">
                      Referrals: <strong className="text-slate-900">{inviter.referredUsers.length}</strong>
                    </span>
                    <span className="text-emerald-600 font-semibold">
                      Earnings: ${formatMoney(inviter.totalReferralEarnings)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                      <th className="py-3 px-4">Referred User</th>
                      <th className="py-3 px-4">Account Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Total Earned</th>
                      <th className="py-3 px-4">Profit Shared</th>
                      <th className="py-3 px-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {inviter.referredUsers.map((ru) => (
                      <tr key={ru.uid} className="hover:bg-slate-50/40">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{ru.email}</div>
                          <div className="text-xs text-slate-400">{ru.displayName || "—"}</div>
                        </td>
                        <td className="py-3 px-4 capitalize">{ru.accountType || (ru.isDemoAccount ? "demo" : "main")}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ru.accountStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {ru.accountStatus || "active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">${formatMoney(ru.totalEarned)}</td>
                        <td className="py-3 px-4 font-medium text-emerald-600">${formatMoney(ru.totalDemoProfitShared)}</td>
                        <td className="py-3 px-4 text-xs text-slate-400">{new Date(ru.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
