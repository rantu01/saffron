"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";

export default function ReferralsPage() {
  const { user, loading } = useAuth();
  const [referral, setReferral] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    async function load() {
      if (!user?.uid) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/user/referral?uid=${encodeURIComponent(user.uid)}`);
        const data = await res.json();
        if (data?.success) setReferral(data.referral);
      } finally { setIsLoading(false); }
    }
    load();
  }, [user?.uid]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({ icon: "success", title: "Copied!", timer: 1000, showConfirmButton: false });
  };

  const generateNewCode = async () => {
    if (!user?.uid) return;
    const res = await fetch("/api/user/referral/generate-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return Swal.fire({ icon: "error", title: "Failed", text: data.message || "Could not generate code" });
    }
    Swal.fire({ icon: "success", title: data.message || "Code generated!", text: data.invitation.code });
    const refRes = await fetch(`/api/user/referral?uid=${encodeURIComponent(user.uid)}`);
    const refData = await refRes.json();
    if (refData?.success) setReferral(refData.referral);
  };

  if (loading || isLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-10 text-slate-600">Loading referral data...</div>;
  }

  if (!user) {
    return <div className="max-w-6xl mx-auto px-4 py-10">Please login to view referrals.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold ">Referral Program</h1>
      <p className="text-sm  mt-1">Invite friends and earn from their activities</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Referrals</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{referral?.totalReferrals || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Referral Earnings</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">${formatMoney(referral?.totalReferralEarnings || 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Invitations</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{referral?.invitations?.filter((i) => !i.usedByEmail).length || 0}</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Your Referral Link</h2>
        </div>
        <div className="p-5">
          {referral?.referralUrl ? (
            <div className="flex items-center gap-3">
              <input
                readOnly
                value={referral.referralUrl}
                className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50 font-mono text-slate-700"
              />
              <button
                onClick={() => copyToClipboard(referral.referralUrl)}
                className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition"
              >
                Copy Link
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Loading referral link...</p>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Your Referral Codes</h2>
          <button
            onClick={generateNewCode}
            className="bg-[#E05305] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#c84a04] transition"
          >
            Generate New Code
          </button>
        </div>
        <div className="overflow-x-auto">
          {referral?.invitations?.length ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Used By</th>
                  <th className="py-4 px-6">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {referral.invitations.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/40">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 tracking-widest">{inv.code}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${inv.usedByEmail ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {inv.usedByEmail ? "Used" : "Available"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{inv.usedByEmail || "-"}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-5 text-sm text-slate-500 text-center">No referral codes generated yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Referred Users</h2>
        </div>
        <div className="overflow-x-auto">
          {referral?.referredUsers?.length ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Account Type</th>
                  <th className="py-4 px-6">Total Earned</th>
                  <th className="py-4 px-6">Profit Shared</th>
                  <th className="py-4 px-6">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {referral.referredUsers.map((ru) => (
                  <tr key={ru.uid} className="hover:bg-slate-50/40">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{ru.displayName || ru.email}</div>
                      <div className="text-xs text-slate-400">{ru.email}</div>
                    </td>
                    <td className="py-4 px-6 capitalize">{ru.accountType}</td>
                    <td className="py-4 px-6 font-medium">${formatMoney(ru.totalEarned)}</td>
                    <td className="py-4 px-6 font-medium text-emerald-600">${formatMoney(ru.totalDemoProfitShared)}</td>
                    <td className="py-4 px-6 text-xs text-slate-400">{new Date(ru.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-5 text-sm text-slate-500 text-center">No referred users yet. Share your referral link!</p>
          )}
        </div>
      </div>
    </div>
  );
}
