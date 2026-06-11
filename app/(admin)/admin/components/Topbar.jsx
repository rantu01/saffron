"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import NotificationBell from "@/app/Component/Common/NotificationBell";

export default function DashboardTopbar({ onToggle }) {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace("/");
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-20 border-b lg:border-[#E5DED6] border-transparent lg:bg-white/90 bg-[#121212] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                {/* Mobile topbar — ultra-minimalist dark */}
                <div className="flex w-full items-center justify-between lg:hidden">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FBBF24]">Saffron Edge</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:border-red-400/60"
                    >
                        Logout
                    </button>
                </div>

                {/* Desktop topbar — original clean style */}
                <div className="hidden min-w-0 items-center gap-3 lg:flex">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C2410C]">Dashboard</p>
                        <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">Task Base Control Center</h1>
                    </div>
                </div>

                <div className="hidden items-center gap-3 sm:gap-4 lg:flex">
                    <NotificationBell uid={user?.uid} />
                    <div className="flex items-center gap-3 rounded-2xl border border-[#E5DED6] bg-white px-3 py-2 shadow-sm">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EA580C] text-sm font-bold text-white">
                            SE
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-slate-900">Admin</p>
                            <p className="text-xs text-slate-500">Operations lead</p>
                        </div>
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}