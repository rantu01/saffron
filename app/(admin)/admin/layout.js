"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthProvider, { useAuth } from "@/app/Component/Auth/AuthProvider";
import DashboardSidebar from "./components/Sidebar";
import DashboardTopbar from "./components/Topbar";

function AdminLayoutShell({ children }) {
	const router = useRouter();
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
		return <div className="min-h-screen bg-[#F8F5F1]" />;
	}

	return (
		<div className="min-h-screen bg-[#F8F5F1] text-slate-900">
			<DashboardSidebar open={open} onClose={() => setOpen(false)} />

			<div className="min-h-screen lg:pl-72">
				<DashboardTopbar onToggle={() => setOpen((value) => !value)} />

				<main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
					<div className="mx-auto w-full max-w-7xl">{children}</div>
				</main>
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
