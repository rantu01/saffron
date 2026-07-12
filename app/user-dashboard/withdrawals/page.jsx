"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";

export default function WithdrawalsPage() {
    const { user, loading } = useAuth();
    const [withdrawals, setWithdrawals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ walletAddress: "", amount: "" });
    const [balance, setBalance] = useState(0);

    const formatMoney = (val) => {
        const n = Number(val || 0);
        if (!Number.isFinite(n)) return "0.00";
        return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    };

    useEffect(() => {
        async function load() {
            if (!user?.uid) {
                setIsLoading(false);
                return;
            }

            try {
                const [withdrawalsRes, dashboardRes] = await Promise.all([
                    fetch(`/api/user/withdrawal?uid=${encodeURIComponent(user.uid)}`),
                    fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`),
                ]);

                const withdrawalsData = await withdrawalsRes.json();
                const dashboardData = await dashboardRes.json();

                if (withdrawalsData.success) setWithdrawals(withdrawalsData.withdrawals || []);
                if (dashboardData.success) setBalance(Number(dashboardData.dashboard?.availableBalance || 0));
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        load();
    }, [user?.uid]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ১. চেক করুন ইউজার আসলেই লগইন অবস্থায় আছে কিনা
        if (!user?.uid || !user?.email) {
            await Swal.fire({
                icon: "error",
                title: "Authentication Error",
                text: "User is not logged in properly. Please refresh and try again."
            });
            return;
        }

        if (!form.walletAddress || !form.amount) {
            await Swal.fire({ icon: "error", title: "Missing Fields", text: "Please enter wallet address and amount" });
            return;
        }

        const numAmount = Number(form.amount);
        if (numAmount > balance) {
            await Swal.fire({ icon: "error", title: "Insufficient Balance", text: `Available balance: $${formatMoney(balance)}` });
            return;
        }

        try {
            const res = await fetch("/api/user/withdrawal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    walletAddress: form.walletAddress,
                    amount: numAmount,
                }),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                // এখানে সুইটঅ্যালার্টে সার্ভার থেকে আসা আসল এরর মেসেজটি দেখতে পাবেন
                await Swal.fire({ icon: "error", title: "Failed", text: result.message || "Something went wrong" });
                return;
            }

            await Swal.fire({ icon: "success", title: "Submitted", text: "Withdrawal request submitted for approval" });
            setForm({ walletAddress: "", amount: "" });
            setShowForm(false);
            setWithdrawals([result.withdrawal, ...withdrawals]);
            setBalance(balance - numAmount);
        } catch (err) {
            console.error("Fetch Error:", err);
            await Swal.fire({ icon: "error", title: "Error", text: "Network error, please try again." });
        }
    };

    if (loading || isLoading) return <div className="text-slate-600">Loading...</div>;

    if (!user) {
        return (
            <div>
                <h1 className="text-2xl font-bold">Withdrawals</h1>
                <p className="mt-2 text-slate-600">Please login to view withdrawals.</p>
            </div>
        );
    }

    const statusColors = {
        pending: "bg-amber-100 text-amber-700",
        approved: "bg-emerald-100 text-emerald-700",
        rejected: "bg-red-100 text-red-700",
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold ">Withdrawals</h1>
                    <p className="text-sm  mt-1">Available Balance: ${formatMoney(balance)}</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="rounded bg-[#E05305] px-4 py-2 text-white hover:bg-[#c84a04]"
                >
                    {showForm ? "Cancel" : "New Withdrawal"}
                </button>
            </div>

            {showForm && (
                <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
                    <h2 className="text-lg font-semibold mb-4">Request Withdrawal</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Wallet Address</label>
                            <input
                                type="text"
                                placeholder="Enter your USDT wallet address"
                                value={form.walletAddress}
                                onChange={(e) => setForm((prev) => ({ ...prev, walletAddress: e.target.value }))}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Withdrawal Amount (USDT)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={balance}
                                placeholder="Enter amount"
                                value={form.amount}
                                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
                                required
                            />
                            <p className="text-xs text-slate-500 mt-1">Max available: ${formatMoney(balance)}</p>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded bg-[#E05305] px-4 py-2 text-white hover:bg-[#c84a04] font-medium"
                        >
                            Submit Withdrawal Request
                        </button>
                    </form>
                </div>
            )}

            <div className="space-y-3">
                {withdrawals.length ? (
                    withdrawals.map((withdrawal) => (
                        <div key={withdrawal._id} className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="font-medium text-slate-900">${formatMoney(withdrawal.amount)}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {withdrawal.walletAddress.substring(0, 20)}...
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[withdrawal.status] || "bg-slate-100"}`}>
                                    {withdrawal.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">{new Date(withdrawal.createdAt).toLocaleDateString()}</p>
                            {withdrawal.status === "rejected" && withdrawal.rejectionReason && (
                                <p className="mt-2 text-xs text-red-600">Reason: {withdrawal.rejectionReason}</p>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-slate-600">No withdrawals yet.</p>
                )}
            </div>
        </div>
    );
}
