"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";
import Link from "next/link";

export default function DepositsPage() {
    const { user, loading } = useAuth();
    const [deposits, setDeposits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ amount: "", screenshot: null });

    const formatMoney = (val, maxDigits = 2) => {
        const n = Number(val || 0);
        if (!Number.isFinite(n)) return "0.00";
        return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: maxDigits });
    };

    useEffect(() => {
        async function loadDeposits() {
            if (!user?.uid) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/user/deposit?uid=${encodeURIComponent(user.uid)}`);
                const data = await res.json();
                if (data.success) setDeposits(data.deposits || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        loadDeposits();
    }, [user?.uid]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
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
        setShowForm(false);
        setDeposits([result.deposit, ...deposits]);
    };

    if (loading || isLoading) return <div className="p-6 text-slate-600 font-medium">Loading...</div>;

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-10">
                <h1 className="text-2xl font-bold text-slate-900">Deposits</h1>
                <p className="mt-2 text-slate-600">Please login to view deposits.</p>
            </div>
        );
    }

    // ইমেজের স্ট্যাটাস কালার কোডিং (Approved, Pending, Rejected)
    const statusColors = {
        pending: "bg-amber-50 text-amber-700 border border-amber-200/60",
        approved: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
        rejected: "bg-red-50 text-red-700 border border-red-200/60",
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8  min-h-screen">
            {/* Top Header Section */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment History</h1>
                    <p className="text-sm text-slate-500 mt-1">View your account top-up history and transaction status</p>
                </div>

                <Link href="/user-dashboard/deposits" className="rounded-xl bg-[#E05305] hover:bg-[#c84a04] px-5 py-2.5 text-white font-semibold text-sm transition shadow-sm self-start sm:self-center flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Deposit
                </Link>
                {/* <button
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-xl bg-[#E05305] hover:bg-[#c84a04] px-5 py-2.5 text-white font-semibold text-sm transition shadow-sm self-start sm:self-center flex items-center gap-1.5"
                >
                    {showForm ? (
                        "Cancel"
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            New Deposit
                        </>
                    )}
                </button> */}
            </div>

            {/* Dynamic Deposit Request Form */}
            {showForm && (
                <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-xl animate-fadeIn">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Submit Deposit</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Amount (USDT)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Enter deposit amount"
                                value={form.amount}
                                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment Screenshot</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 text-slate-500"
                                required
                            />
                            {form.screenshot && <p className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">✓ Screenshot loaded successfully</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-[#E05305] px-4 py-2.5 text-white hover:bg-[#c84a04] font-bold text-sm transition shadow-sm"
                        >
                            Submit Deposit
                        </button>
                    </form>
                </div>
            )}

            {/* Data Table Container matching image_03961c.jpg structure */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/75 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                <th className="py-4 px-5 font-semibold text-slate-600">Date</th>
                                <th className="py-4 px-5 font-semibold text-slate-600">Account</th>
                                <th className="py-4 px-5 font-semibold text-slate-600">Amount (BDT)</th>
                                <th className="py-4 px-5 font-semibold text-slate-600">Credited (USD)</th>
                                <th className="py-4 px-5 font-semibold text-slate-600">Transaction Ref</th>
                                <th className="py-4 px-5 font-semibold text-slate-600">Payment Method</th>
                                <th className="py-4 px-5 font-semibold text-slate-600">Status</th>
                                <th className="py-4 px-5 font-semibold text-slate-600">Rejection Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {deposits.length ? (
                                deposits.map((deposit) => {
                                    // রিয়েলটাইম BDT কনভার্সন রেট (যেমনটি ছবিতে ১২৯ টাকা রেট দেখানো ছিল)
                                    const bdtAmount = Number(deposit.amount || 0) * 129;

                                    return (
                                        <tr key={deposit._id} className="hover:bg-slate-50/40 transition">
                                            {/* Date Column */}
                                            <td className="py-4 px-5 font-medium text-slate-900 whitespace-nowrap">
                                                {new Date(deposit.createdAt).toLocaleDateString()}
                                            </td>

                                            {/* Account Name */}
                                            <td className="py-4 px-5 text-slate-600 whitespace-nowrap">
                                                Account Balance
                                            </td>

                                            {/* Amount BDT (Dynamic simulation based on USD) */}
                                            <td className="py-4 px-5 font-medium text-slate-900 whitespace-nowrap">
                                                {formatMoney(bdtAmount, 2)} BDT
                                            </td>

                                            {/* Credited USD */}
                                            <td className="py-4 px-5 font-bold text-slate-900 whitespace-nowrap">
                                                ${formatMoney(deposit.amount, 2)}
                                            </td>

                                            {/* Transaction Ref (Dynamic or Fallback hash) */}
                                            <td className="py-4 px-5 font-mono text-xs text-slate-500 whitespace-nowrap">
                                                {deposit._id ? deposit._id.substring(0, 6).toUpperCase() : "880009"}
                                            </td>

                                            {/* Payment Method */}
                                            <td className="py-4 px-5 text-slate-600 whitespace-nowrap">
                                                Crypto Wallet / USDT
                                            </td>

                                            {/* Status Checkbox/Badge Style */}
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[deposit.status] || "bg-slate-100"}`}>
                                                    {deposit.status === "approved" && (
                                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                    )}
                                                    {deposit.status === "rejected" && (
                                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                    )}
                                                    {deposit.status}
                                                </span>
                                            </td>

                                            {/* Rejection Reason Column */}
                                            <td className="py-4 px-5 text-xs whitespace-nowrap">
                                                {deposit.status === "rejected" && deposit.rejectionReason ? (
                                                    <span className="text-red-600 font-medium">{deposit.rejectionReason}</span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="py-8 text-center text-slate-500 font-medium">
                                        No deposits records found yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}