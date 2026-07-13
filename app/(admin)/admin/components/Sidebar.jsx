"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, CheckSquare, Users, DollarSign, Send, History, Share2, Layers, Megaphone, Settings, RefreshCw, MessageSquare, BarChart3, MessageCircle, Crown } from "lucide-react";
import { useAdminNotificationCounts } from "./AdminNotificationContext";

const navigation = [
    { label: "Overview", href: "/admin", icon: LayoutGrid },
    { label: "User Management", href: "/admin/user-management", icon: Users },
    { label: "Task Management", href: "/admin/task-management", icon: CheckSquare },
    { label: "Combined Tasks", href: "/admin/combo-settings", icon: Layers },
    { label: "VIP Levels", href: "/admin/vip-levels", icon: Crown },
    { label: "Deposit Verification", href: "/admin/deposits", icon: DollarSign },
    { label: "Withdrawal Requests", href: "/admin/withdrawals", icon: Send },
    { label: "Balance Logs", href: "/admin/balance-logs", icon: History },
    { label: "Referral Management", href: "/admin/referrals", icon: Share2 },
    // { label: "Ad Accounts", href: "/admin/ad-accounts", icon: Megaphone },
    { label: "Live Chat", href: "/admin/chat", icon: MessageCircle },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    // { label: "Meta API", href: "/admin/meta-api", icon: RefreshCw },
    // { label: "WhatsApp", href: "/admin/whatsapp", icon: MessageSquare },
];

export default function DashboardSidebar({ open, onClose }) {
    const pathname = usePathname();
    const { pendingDeposits, unreadMessages, pendingVipRequests } = useAdminNotificationCounts();

    function getBadgeCount(href) {
        if (href === "/admin/deposits") return pendingDeposits;
        if (href === "/admin/chat") return unreadMessages;
        if (href === "/admin/vip-levels") return pendingVipRequests;
        return 0;
    }

    return (
        <div className="hidden lg:block">
            <aside className="fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-white/10 bg-gradient-to-b from-[#101828] via-[#0F172A] to-[#111827] text-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-[#F59E0B]">Saffron Edge</p>
                        <h2 className="mt-1 text-xl font-semibold">Dashboard</h2>
                    </div>
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

                <nav className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-thin">
                    <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Navigation</p>
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const active = pathname === item.href;
                            const Icon = item.icon;

                            const count = getBadgeCount(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${active
                                            ? "bg-[#F59E0B] text-slate-950 shadow-lg shadow-[#F59E0B]/20"
                                            : "text-white/70 hover:bg-white/8 hover:text-white"
                                        }`}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) onClose();
                                    }}
                                >
                                    <span className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-white/20" : "bg-white/10 group-hover:bg-white/15"}`}>
                                        <Icon size={18} />
                                        {count > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
                                                {count > 99 ? "99+" : count}
                                            </span>
                                        )}
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
        </div>
    );
}