"use client";

import { useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function DepositsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(true);
  const [form, setForm] = useState({ amount: "", screenshot: null });
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: "error", title: "File Too Large", text: "Screenshot must be under 5MB" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm((prev) => ({ ...prev, screenshot: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.amount || !form.screenshot) {
      await Swal.fire({ icon: "error", title: "Missing Fields", text: "Please enter amount and upload screenshot" });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/user/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          amount: form.amount,
          screenshot: form.screenshot,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        await Swal.fire({ icon: "error", title: "Failed", text: result.message });
        return;
      }

      await Swal.fire({ icon: "success", title: "Submitted", text: "Deposit request submitted for verification" });
      setForm({ amount: "", screenshot: null });
      router.push("/user-dashboard/payments");
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-600">Loading...</div>;

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Deposits</h1>
        <p className="mt-2 text-slate-600">Please login to make a deposit.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold ">New Deposit</h1>
          <p className="text-sm  mt-1">Submit a deposit request for verification</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-[#E05305] px-4 py-2 text-white hover:bg-[#c84a04]"
        >
          {showForm ? "Hide Form" : "New Deposit"}
        </button>
      </div>

      {showForm && (
        <div className="max-w-lg rounded-lg border border-slate-200 bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount (USDT)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter deposit amount"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#E05305] focus:outline-none focus:ring-1 focus:ring-[#E05305]"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#E05305] file:px-3 file:py-1.5 file:text-xs file:text-white"
                required
                disabled={submitting}
              />
              {form.screenshot && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-emerald-600">✓ Screenshot uploaded</span>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, screenshot: null }))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">Max 5MB. Accepted: JPG, PNG, WEBP</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#E05305] px-4 py-2.5 text-white font-medium hover:bg-[#c84a04] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Deposit"}
            </button>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Click "New Deposit" to submit a deposit request.</p>
        </div>
      )}
    </div>
  );
}
