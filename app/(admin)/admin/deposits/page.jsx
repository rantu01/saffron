"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const loadDeposits = async () => {
    setLoading(true);
    try {
      const query = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/deposits${query}`);
      const data = await res.json();
      if (data.success) setDeposits(data.deposits || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDeposits(); }, [filter]);

  const handleApprove = async (depositId) => {
    const confirmed = await Swal.fire({
      icon: "question", title: "Approve Deposit?", text: "User balance will be updated immediately.",
      showCancelButton: true, confirmButtonText: "Yes, approve",
    });
    if (!confirmed.isConfirmed) return;

    const res = await fetch("/api/admin/deposits", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId, status: "approved", approverUid: "admin" }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Failed", text: result.message });
      return;
    }
    await Swal.fire({ icon: "success", title: "Approved", timer: 1200, showConfirmButton: false });
    loadDeposits();
  };

  const handleReject = async (depositId) => {
    const { value: reason } = await Swal.fire({
      icon: "warning", title: "Reject Deposit", input: "text", inputLabel: "Reason for rejection",
      inputPlaceholder: "Enter reason...", showCancelButton: true, confirmButtonText: "Reject",
    });
    if (!reason) return;
    const res = await fetch("/api/admin/deposits", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId, status: "rejected", rejectionReason: reason }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Failed", text: result.message });
      return;
    }
    await Swal.fire({ icon: "success", title: "Rejected", timer: 1200, showConfirmButton: false });
    loadDeposits();
  };

  const statusColors = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Deposit Verification</h1>
      <p className="text-sm text-slate-500 mb-6">Review and approve/reject deposit requests</p>

      <div className="mb-6 flex gap-2">
        {["pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
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
      ) : deposits.length ? (
        <div className="space-y-3">
          {deposits.map((deposit) => (
            <div key={deposit._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{deposit.email || deposit.uid}</p>
                  <p className="text-sm text-slate-500 mt-0.5">Amount: <strong>${formatMoney(deposit.amount)}</strong></p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(deposit.createdAt).toLocaleString()}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize border ${statusColors[deposit.status]}`}>
                  {deposit.status}
                </span>
              </div>

              {deposit.screenshot && (
                <button
                  onClick={() => { setSelectedDeposit(deposit); setPreviewOpen(true); }}
                  className="mb-3 text-xs text-blue-600 underline hover:no-underline"
                >
                  View Screenshot
                </button>
              )}

              {deposit.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(deposit._id)} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white font-medium hover:bg-emerald-700 transition">
                    Approve
                  </button>
                  <button onClick={() => handleReject(deposit._id)} className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm text-white font-medium hover:bg-red-700 transition">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No {filter} deposits found.
        </div>
      )}

      {previewOpen && selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewOpen(false)}>
          <div className="relative max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewOpen(false)} className="absolute -right-3 -top-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg text-slate-700 hover:text-slate-900">&times;</button>
            <img src={selectedDeposit.screenshot} alt="Payment proof" className="max-h-[80vh] w-auto rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
