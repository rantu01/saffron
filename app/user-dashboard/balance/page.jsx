"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";

export default function BalancePage() {
	const { user, loading } = useAuth();
	const [balance, setBalance] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	const formatMoney = (val) => {
		const n = Number(val || 0);
		if (!Number.isFinite(n)) return '0.00';
		return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
	};

	useEffect(() => {
		async function load() {
			if (!user?.uid) {
				setIsLoading(false);
				return;
			}

			try {
				setError("");
				const res = await fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`);
				const data = await res.json();
				if (!res.ok || !data.success) throw new Error(data.message || "Failed to load balance");
				setBalance(Number(data.dashboard?.availableBalance || 0));
			} catch (err) {
				setError(err.message || "Failed to load balance");
			} finally {
				setIsLoading(false);
			}
		}

		load();
	}, [user?.uid]);

	if (loading || isLoading) return <div className="px-4 py-8 text-slate-600">Loading balance...</div>;

	if (!user) {
		return (
			<div className="px-4 py-8">
				<h1 className="text-2xl font-semibold">Available Balance</h1>
				<p className="mt-2 text-slate-600">Please login to view your balance.</p>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<h1 className="text-2xl font-semibold">Available Balance</h1>
			{error && <p className="mt-2 text-red-600">{error}</p>}

			<div className="mt-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
				<p className="text-sm text-slate-500">Current available balance</p>
				<p className="mt-2 text-3xl font-semibold text-emerald-600">${formatMoney(balance)}</p>
			</div>
		</div>
	);
}

