"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, CheckSquare, Users, X } from "lucide-react";

const navigation = [
    { label: "Overview", href: "/admin", icon: LayoutGrid },
    { label: "Task Management", href: "/admin/task-management", icon: CheckSquare },
    { label: "User Management", href: "/admin/user-management", icon: Users },
];

export default function DashboardSidebar({ open, onClose }) {
    const pathname = usePathname();

    return (
        <>
            <div
                className={`fixed inset-0 z-30 bg-slate-950/50 transition-opacity duration-200 lg:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            <aside
                className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-white/10 bg-gradient-to-b from-[#101828] via-[#0F172A] to-[#111827] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-[#F59E0B]">Saffron Edge</p>
                        <h2 className="mt-1 text-xl font-semibold">Dashboard</h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-5">
                    <div className="rounded-2xl border border-[#F59E0B]/20 bg-white/5 p-4 backdrop-blur">
                        <p className="text-sm text-white/70">Active workspace</p>
                        <p className="mt-1 text-lg font-semibold text-white">Operations Hub</p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#F59E0B]/15 px-3 py-1 text-xs font-medium text-[#FDBA74]">
                            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Online
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 pb-6">
                    <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Navigation</p>
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const active = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${active
                                            ? "bg-[#F59E0B] text-slate-950 shadow-lg shadow-[#F59E0B]/20"
                                            : "text-white/70 hover:bg-white/8 hover:text-white"
                                        }`}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) onClose();
                                    }}
                                >
                                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-white/20" : "bg-white/10 group-hover:bg-white/15"}`}>
                                        <Icon size={18} />
                                    </span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="border-t border-white/10 px-6 py-5">
                    <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-sm font-medium text-white">Need support?</p>
                        <p className="mt-1 text-sm text-white/60">Contact the admin team for access or workflow help.</p>
                    </div>
                </div>
            </aside>
        </>
    );
}