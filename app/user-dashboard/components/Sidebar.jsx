"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ListChecks, User, CreditCard, AppWindowMac, DollarSign, Send, ChevronDown, Share2 } from "lucide-react";

const navigation = [
    { label: "Dashboard", href: "/user-dashboard", icon: AppWindowMac },
    // { label: "Ad Account", href: "/user-dashboard/ad-account", icon: ListChecks },
    { label: "My Tasks", href: "/user-dashboard/tasks", icon: ListChecks },
    // { label: "Referrals", href: "/user-dashboard/referrals", icon: Share2 },
    // { label: "Withdrawals", href: "/user-dashboard/withdrawals", icon: Send },
    { label: "Profile", href: "/user-dashboard/profile", icon: User },
];

const paymentChildren = [
    { label: "Deposits", href: "/user-dashboard/deposits" },
    { label: "Deposit History", href: "/user-dashboard/payments" },
    { label: "Withdrawals", href: "/user-dashboard/withdrawals", icon: Send },
];

const balanceChildren = [
    { label: "Balance Overview", href: "/user-dashboard/balance" },
    { label: "Balance History", href: "/user-dashboard/balance-history" },
];

export default function UserSidebar({ open, onClose }) {
    const pathname = usePathname();
    const [paymentsOpen, setPaymentsOpen] = useState(
        pathname.startsWith("/user-dashboard/deposits") || pathname.startsWith("/user-dashboard/payments")
    );
    const [balanceOpen, setBalanceOpen] = useState(
        pathname.startsWith("/user-dashboard/balance")
    );

    const paymentsActive = pathname.startsWith("/user-dashboard/deposits") || pathname.startsWith("/user-dashboard/payments");
    const balanceActive = pathname.startsWith("/user-dashboard/balance");

    const handleNavClick = () => {};

    return (
        <div className="hidden xl:block">
            <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/5 bg-gradient-to-b from-[#FFF7ED] via-[#FFFBF7] to-[#FFF7F0] text-slate-900 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <Link href="/">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-[#E05305]">Saffron Edge</p>
                            <h2 className="mt-1 text-lg font-semibold">Your Dashboard</h2>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const active = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${active
                                        ? "bg-[#E05305] text-white shadow"
                                        : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    onClick={handleNavClick}
                                >
                                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-white/10" : "bg-white/5"}`}>
                                        <Icon size={18} />
                                    </span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Payments dropdown */}
                        <div>
                            <button
                                onClick={() => setPaymentsOpen(!paymentsOpen)}
                                className={`group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${paymentsActive
                                    ? "bg-[#E05305] text-white shadow"
                                    : "text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${paymentsActive ? "bg-white/10" : "bg-white/5"}`}>
                                    <ListChecks size={18} />
                                </span>
                                <span className="flex-1 text-left">Payments</span>
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform duration-200 ${paymentsOpen ? "rotate-0" : "-rotate-90"}`}
                                />
                            </button>

                            <div
                                className={`grid transition-all duration-200 ease-in-out ${paymentsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                    }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="ml-4 mt-1 space-y-1 pl-6 border-l-2 border-slate-200">
                                        {paymentChildren.map((child) => {
                                            const childActive = pathname === child.href;
                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    onClick={handleNavClick}
                                                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${childActive
                                                        ? "bg-[#E05305]/10 text-[#E05305]"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                        }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${childActive ? "bg-[#E05305]" : "bg-slate-300"}`} />
                                                    {child.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Balance dropdown */}
                        <div>
                            <button
                                onClick={() => setBalanceOpen(!balanceOpen)}
                                className={`group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${balanceActive
                                    ? "bg-[#E05305] text-white shadow"
                                    : "text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${balanceActive ? "bg-white/10" : "bg-white/5"}`}>
                                    <CreditCard size={18} />
                                </span>
                                <span className="flex-1 text-left">Balance</span>
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform duration-200 ${balanceOpen ? "rotate-0" : "-rotate-90"}`}
                                />
                            </button>

                            <div
                                className={`grid transition-all duration-200 ease-in-out ${balanceOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                    }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="ml-4 mt-1 space-y-1 pl-6 border-l-2 border-slate-200">
                                        {balanceChildren.map((child) => {
                                            const childActive = pathname === child.href;
                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    onClick={handleNavClick}
                                                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${childActive
                                                        ? "bg-[#E05305]/10 text-[#E05305]"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                        }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${childActive ? "bg-[#E05305]" : "bg-slate-300"}`} />
                                                    {child.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="border-t border-slate-200 px-6 py-5">
                    <div className="rounded-lg bg-white p-3">
                        <p className="text-sm text-slate-700">Need help?</p>
                        <p className="mt-1 text-xs text-slate-500">Contact support for account help.</p>
                    </div>
                </div>
            </aside>
        </div>
    );
}
