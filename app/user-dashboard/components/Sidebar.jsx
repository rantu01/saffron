"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, User, CreditCard, X, AppWindowMac } from "lucide-react";

const navigation = [
    { label: "Home", href: "/", icon: Home },
    { label: "Overview", href: "/user-dashboard", icon: AppWindowMac },

    { label: "My Tasks", href: "/user-dashboard/tasks", icon: ListChecks },
    { label: "Balance", href: "/user-dashboard/balance", icon: CreditCard },
    { label: "Profile", href: "/user-dashboard/profile", icon: User },
];

export default function UserSidebar({ open, onClose }) {
    const pathname = usePathname();

    return (
        <>
            <div
                className={`fixed inset-0 z-30 bg-slate-950/50 transition-opacity duration-200 lg:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            <aside
                className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/5 bg-gradient-to-b from-[#FFF7ED] via-[#FFFBF7] to-[#FFF7F0] text-slate-900 transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-[#E05305]">Saffron Edge</p>
                        <h2 className="mt-1 text-lg font-semibold">Your Dashboard</h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const active = pathname === item.href || (item.href.includes('#') && pathname === '/dashboard');
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${active
                                        ? "bg-[#E05305] text-white shadow"
                                        : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) onClose();
                                    }}
                                >
                                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-white/10" : "bg-white/5"}`}>
                                        <Icon size={18} />
                                    </span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="border-t border-slate-200 px-6 py-5">
                    <div className="rounded-lg bg-white p-3">
                        <p className="text-sm text-slate-700">Need help?</p>
                        <p className="mt-1 text-xs text-slate-500">Contact support for account help.</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
