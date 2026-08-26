"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";

const NETWORKS = [
	{ value: "TRC20", label: "TRC20 (Tron)" },
	{ value: "ERC20", label: "ERC20 (Ethereum)" },
	{ value: "BEP20", label: "BEP20 (BSC)" },
	{ value: "Polygon", label: "Polygon" },
	{ value: "Solana", label: "Solana" },
	{ value: "Bitcoin", label: "Bitcoin" },
];

export default function BalancePage() {
	const { user, loading } = useAuth();
	const [balance, setBalance] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	const [walletAddress, setWalletAddress] = useState("");
	const [walletNetwork, setWalletNetwork] = useState("TRC20");
	const [isSaving, setIsSaving] = useState(false);
	const [saved, setSaved] = useState(false);

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
				setWalletAddress(data.dashboard?.walletAddress || "");
				setWalletNetwork(data.dashboard?.walletNetwork || "TRC20");
			} catch (err) {
				setError(err.message || "Failed to load balance");
			} finally {
				setIsLoading(false);
			}
		}

		load();
	}, [user?.uid]);

	const handleSave = async () => {
		if (!user?.uid) return;

		if (!walletAddress.trim()) {
			await Swal.fire({ icon: "error", title: "Missing Address", text: "Please enter your wallet address." });
			return;
		}

		setIsSaving(true);
		setSaved(false);
		try {
			const res = await fetch("/api/user/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					uid: user.uid,
					walletAddress: walletAddress.trim(),
					walletNetwork,
				}),
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				await Swal.fire({ icon: "error", title: "Failed", text: result.message || "Could not save address." });
				return;
			}
			setSaved(true);
			await Swal.fire({ icon: "success", title: "Saved", text: "Your withdrawal address has been saved and will appear in the withdrawal form." });
		} catch (err) {
			await Swal.fire({ icon: "error", title: "Error", text: "Network error, please try again." });
		} finally {
			setIsSaving(false);
		}
	};

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

			<div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
				<h2 className="text-lg font-semibold">Withdrawal Address</h2>
				<p className="text-sm text-slate-500 mt-1">
					Bind your wallet address and network. It will be pre-filled automatically in the withdrawal form.
				</p>

				<div className="mt-4 space-y-4">
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-2">Wallet Address</label>
						<input
							type="text"
							placeholder="Enter your USDT wallet address"
							value={walletAddress}
							onChange={(e) => { setWalletAddress(e.target.value); setSaved(false); }}
							className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-2">Network</label>
						<select
							value={walletNetwork}
							onChange={(e) => { setWalletNetwork(e.target.value); setSaved(false); }}
							className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
						>
							{NETWORKS.map((n) => (
								<option key={n.value} value={n.value}>{n.label}</option>
							))}
						</select>
					</div>

					<button
						onClick={handleSave}
						disabled={isSaving}
						className="rounded bg-[#E05305] px-4 py-2 text-white hover:bg-[#c84a04] font-medium disabled:opacity-50"
					>
						{isSaving ? "Saving..." : "Save Address"}
					</button>
					{saved && <span className="ml-3 text-sm text-emerald-600">✓ Address saved</span>}
				</div>
			</div>
		</div>
	);
}
