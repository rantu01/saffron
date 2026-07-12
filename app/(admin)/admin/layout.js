"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import AuthProvider, { useAuth } from "@/app/Component/Auth/AuthProvider";
import DashboardSidebar from "./components/Sidebar";
import DashboardTopbar from "./components/Topbar";
import { AdminNotificationProvider, useAdminNotificationCounts } from "./components/AdminNotificationContext";
import {
	LayoutGrid, CheckSquare, Users, DollarSign, Send,
	History, Share2, BarChart3, LayoutDashboard, Grid3X3, FileText, MessageCircle, X, ChevronRight
} from "lucide-react";

const mobileNavItems = [
	{ label: "Overview", href: "/admin", icon: LayoutGrid },
	{ label: "User Management", href: "/admin/user-management", icon: Users },
	{ label: "Task Management", href: "/admin/task-management", icon: CheckSquare },
	{ label: "Combo Settings", href: "/admin/combo-settings", icon: CheckSquare },
	{ label: "Deposits", href: "/admin/deposits", icon: DollarSign },
	{ label: "Withdrawals", href: "/admin/withdrawals", icon: Send },
	{ label: "Balance Logs", href: "/admin/balance-logs", icon: History },
	{ label: "Referrals", href: "/admin/referrals", icon: Share2 },
	{ label: "Live Chat", href: "/admin/chat", icon: MessageCircle },
	{ label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

const bottomNavItems = [
	{ label: "Home", href: "/admin", icon: LayoutDashboard },
	{ label: "Management", href: "/admin/user-management", icon: Grid3X3 },
	{ label: "Reports", href: "/admin/reports", icon: FileText },
];

function Badge({ count }) {
	if (count === 0) return null;
	return (
		<span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
			{count > 99 ? "99+" : count}
		</span>
	);
}

function AdminLayoutShell({ children }) {
	const router = useRouter();
	const pathname = usePathname();
	const { user, loading } = useAuth();
	const [open, setOpen] = useState(false);
	const [roleChecking, setRoleChecking] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const isDashboard = pathname === '/admin';
	const { pendingDeposits, unreadMessages } = useAdminNotificationCounts();

	function getBadgeCount(href) {
		if (href === "/admin/deposits") return pendingDeposits;
		if (href === "/admin/chat") return unreadMessages;
		return 0;
	}

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

				{/* MOBILE APP LAUNCHER - only on dashboard home */}
				{isDashboard && (
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
							const count = getBadgeCount(item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									className="relative flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#FBBF24] p-3 aspect-square"
								>
									<Badge count={count} />
									<Icon size={24} className="text-slate-900" />
									<span className="text-[10px] font-bold text-slate-900 text-center leading-tight">
										{item.label}
									</span>
								</Link>
							);
						})}
					</div>
				</div>
				)}

				<main className="px-4 pb-20 lg:pb-0 py-5 sm:px-6 lg:px-8 lg:py-8 lg:bg-transparent bg-[#121212]">
					<div className="mx-auto w-full max-w-7xl">{children}</div>
				</main>
			</div>

			{/* MOBILE SLIDE-IN DRAWER */}
			{mobileMenuOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
					<div className="fixed left-0 top-0 h-full w-[280px] bg-[#121212] shadow-2xl overflow-y-auto animate-slide-in-left">
						<div className="p-5">
							<button
								onClick={() => setMobileMenuOpen(false)}
								className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
							>
								<X size={18} />
							</button>

							<div className="flex items-center gap-3 mb-6 mt-2">
								<div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
									{(user?.displayName || 'A').charAt(0).toUpperCase()}
								</div>
								<div className="flex-1 min-w-0">
									<h2 className="text-white font-bold text-base truncate">
										{user?.displayName || 'Admin'}
									</h2>
									<p className="text-[10px] text-slate-400 mt-0.5">Operations Hub</p>
								</div>
							</div>

							<div className="space-y-0.5">
								{mobileNavItems.map((item) => {
									const Icon = item.icon;
									const active = pathname === item.href;
									const count = getBadgeCount(item.href);
									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setMobileMenuOpen(false)}
											className={`relative flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${active ? 'bg-[#FBBF24]/10' : 'hover:bg-slate-800/50'}`}
										>
											<div className="flex items-center gap-3">
												<div className="relative">
													<Icon size={18} className={active ? 'text-[#FBBF24]' : 'text-[#FBBF24]'} />
													<Badge count={count} />
												</div>
												<span className={`text-sm font-medium ${active ? 'text-[#FBBF24]' : 'text-white'}`}>{item.label}</span>
											</div>
											<ChevronRight size={14} className="text-slate-600" />
										</Link>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* MOBILE BOTTOM NAV */}
			<div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#FBBF24]">
				<div className="flex items-center justify-around py-2">
					{bottomNavItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
						if (item.label === 'Home') {
							return (
								<button
									key={item.label}
									onClick={() => setMobileMenuOpen(true)}
									className="flex flex-col items-center gap-0.5 px-4 py-1 text-slate-900"
								>
									<Icon size={20} />
									<span className="text-[10px] font-semibold">{item.label}</span>
								</button>
							);
						}
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
			<AdminNotificationProvider>
				<AdminLayoutShell>{children}</AdminLayoutShell>
			</AdminNotificationProvider>
		</AuthProvider>
	);
}
