"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import AuthProvider, { useAuth } from "@/app/Component/Auth/AuthProvider";
import DashboardSidebar from "./components/Sidebar";
import DashboardTopbar from "./components/Topbar";
import {
	LayoutGrid, CheckSquare, Users, DollarSign, Send,
	History, Share2, BarChart3, LayoutDashboard, Grid3X3, FileText
} from "lucide-react";

const mobileNavItems = [
	{ label: "Overview", href: "/admin", icon: LayoutGrid },
	{ label: "User Management", href: "/admin/user-management", icon: Users },
	{ label: "Task Management", href: "/admin/task-management", icon: CheckSquare },
	{ label: "Deposits", href: "/admin/deposits", icon: DollarSign },
	{ label: "Withdrawals", href: "/admin/withdrawals", icon: Send },
	{ label: "Balance Logs", href: "/admin/balance-logs", icon: History },
	{ label: "Referrals", href: "/admin/referrals", icon: Share2 },
	{ label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

const bottomNavItems = [
	{ label: "Home", href: "/admin", icon: LayoutDashboard },
	{ label: "Management", href: "/admin/user-management", icon: Grid3X3 },
	{ label: "Reports", href: "/admin/reports", icon: FileText },
];

function AdminLayoutShell({ children }) {
	const router = useRouter();
	const pathname = usePathname();
	const { user, loading } = useAuth();
	const [open, setOpen] = useState(false);
	const [roleChecking, setRoleChecking] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		let mounted = true;

		async function verifyRole() {
			if (loading) return;

			if (!user?.uid) {
				if (mounted) {
					setIsAdmin(false);
					setRoleChecking(false);
				}
				router.replace("/");
				return;
			}

			try {
				const res = await fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`);
				const data = await res.json();
				const hasAdminRole = Boolean(res.ok && data?.success && data?.dashboard?.role === "admin");

				if (mounted) {
					setIsAdmin(hasAdminRole);
					setRoleChecking(false);
				}

				if (!hasAdminRole) {
					router.replace("/");
				}
			} catch {
				if (mounted) {
					setIsAdmin(false);
					setRoleChecking(false);
				}
				router.replace("/");
			}
		}

		verifyRole();

		return () => {
			mounted = false;
		};
	}, [loading, router, user?.uid]);

	if (loading || roleChecking || !isAdmin) {
		return <div className="min-h-screen lg:bg-[#F8F5F1] bg-[#121212]" />;
	}

	return (
		<div className="min-h-screen lg:bg-[#F8F5F1] bg-[#121212] lg:text-slate-900 text-white">
			<DashboardSidebar open={open} onClose={() => setOpen(false)} />

			<div className="min-h-screen lg:pl-72">
				<DashboardTopbar onToggle={() => setOpen((value) => !value)} />

				{/* MOBILE APP LAUNCHER */}
				<div className="lg:hidden bg-[#121212] px-4 pt-2 pb-6">
					<div className="mb-6">
						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FBBF24]">
							Saffron Edge
						</p>
						<h1 className="mt-1 text-xl font-bold text-white">Admin Dashboard</h1>
					</div>

					<div className="grid grid-cols-3 gap-3">
						{mobileNavItems.map((item) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.href}
									href={item.href}
									className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#FBBF24] p-3 aspect-square"
								>
									<Icon size={24} className="text-slate-900" />
									<span className="text-[10px] font-bold text-slate-900 text-center leading-tight">
										{item.label}
									</span>
								</Link>
							);
						})}
					</div>

					<div className="mt-6 rounded-2xl bg-slate-800/80 h-44 flex items-center justify-center overflow-hidden border border-slate-700/50">
						<div className="text-center">
							<svg className="w-10 h-10 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<p className="mt-2 text-xs text-slate-500">Admin Panel</p>
						</div>
					</div>
				</div>

				<main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8 lg:bg-transparent bg-[#121212]">
					<div className="mx-auto w-full max-w-7xl">{children}</div>
				</main>
			</div>

			{/* MOBILE BOTTOM NAV */}
			<div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#FBBF24]">
				<div className="flex items-center justify-around py-2">
					{bottomNavItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
						return (
							<Link
								key={item.label}
								href={item.href}
								className={`flex flex-col items-center gap-0.5 px-4 py-1 ${isActive ? 'text-slate-900' : 'text-slate-700'}`}
							>
								<Icon size={20} />
								<span className="text-[10px] font-semibold">{item.label}</span>
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default function DashboardLayout({ children }) {
	return (
		<AuthProvider>
			<AdminLayoutShell>{children}</AdminLayoutShell>
		</AuthProvider>
	);
}
