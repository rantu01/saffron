"use client";

import { Menu, Search, Bell, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/Component/Auth/AuthProvider";

export default function DashboardTopbar({ onToggle }) {
    const router = useRouter();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace("/");
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-20 border-b border-[#E5DED6] bg-white/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={onToggle}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E5DED6] bg-white text-slate-700 shadow-sm transition hover:border-[#F59E0B] hover:text-[#C2410C] lg:hidden"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={20} />
                    </button>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C2410C]">Dashboard</p>
                        <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">Task Base Control Center</h1>
                    </div>
                </div>

                {/* <div className="hidden flex-1 justify-center px-4 xl:flex">
                    <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-[#E5DED6] bg-[#FAF7F3] px-4 py-3 shadow-sm">
                        <Search size={18} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tasks, users, reports..."
                            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div> */}

                <div className="flex items-center gap-3 sm:gap-4">
                    {/* <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E5DED6] bg-white text-slate-700 shadow-sm transition hover:border-[#F59E0B] hover:text-[#C2410C]" aria-label="Notifications">
                        <Bell size={18} />
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#F59E0B]" />
                    </button> */}

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