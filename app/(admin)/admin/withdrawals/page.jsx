"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const ITEMS_PER_PAGE = 15;

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(1);

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const query = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/withdrawals${query}`);
      const data = await res.json();
      if (data.success) setWithdrawals(data.withdrawals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWithdrawals(); }, [filter]);

  const handleApprove = async (withdrawalId) => {
    const confirmed = await Swal.fire({
      icon: "question", title: "Approve Withdrawal?", text: "User balance will be deducted immediately.",
      showCancelButton: true, confirmButtonText: "Yes, approve",
    });
    if (!confirmed.isConfirmed) return;

    const res = await fetch("/api/admin/withdrawals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, status: "approved", approverUid: "admin" }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Failed", text: result.message });
      return;
    }
    await Swal.fire({ icon: "success", title: "Approved", timer: 1200, showConfirmButton: false });
    loadWithdrawals();
  };

  const handleReject = async (withdrawalId) => {
    const { value: reason } = await Swal.fire({
      icon: "warning", title: "Reject Withdrawal", input: "text", inputLabel: "Reason for rejection",
      inputPlaceholder: "Enter reason...", showCancelButton: true, confirmButtonText: "Reject",
    });
    if (!reason) return;
    const res = await fetch("/api/admin/withdrawals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, status: "rejected", rejectionReason: reason }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Failed", text: result.message });
      return;
    }
    await Swal.fire({ icon: "success", title: "Rejected", timer: 1200, showConfirmButton: false });
    loadWithdrawals();
  };

  const statusColors = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Withdrawal Requests</h1>
      <p className="text-sm text-slate-500 mb-6">Review and approve/reject withdrawal requests</p>

      <div className="mb-6 flex gap-2">
        {["pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors text-sm ${
              filter === status
                ? "bg-[#F59E0B] text-slate-950"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : withdrawals.length ? (
        <div className="space-y-3">
          {withdrawals.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((withdrawal) => (
            <div key={withdrawal._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{withdrawal.email || withdrawal.uid}</p>
                  <p className="text-sm text-slate-500 mt-0.5">Amount: <strong>${formatMoney(withdrawal.amount)}</strong></p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Wallet: {withdrawal.walletAddress}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(withdrawal.createdAt).toLocaleString()}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize border ${statusColors[withdrawal.status]}`}>
                  {withdrawal.status}
                </span>
              </div>

              {withdrawal.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(withdrawal._id)} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white font-medium hover:bg-emerald-700 transition">
                    Approve
                  </button>
                  <button onClick={() => handleReject(withdrawal._id)} className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm text-white font-medium hover:bg-red-700 transition">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No {filter} withdrawals found.
        </div>
      )}

      {withdrawals.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm mt-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {Math.ceil(withdrawals.length / ITEMS_PER_PAGE)}</span>
          <button
            onClick={() => setPage((p) => Math.min(Math.ceil(withdrawals.length / ITEMS_PER_PAGE), p + 1))}
            disabled={page >= Math.ceil(withdrawals.length / ITEMS_PER_PAGE)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
