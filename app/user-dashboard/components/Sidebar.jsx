"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ListChecks, User, CreditCard, AppWindowMac, DollarSign, Send, ChevronDown, Share2, MessageCircle, Bell } from "lucide-react";
import { useUserNotifications } from "./UserNotificationContext";
import { useLanguage } from "./LanguageContext";
import LanguageSelector from "./LanguageSelector";

const navigation = [
    { key: "sidebar.dashboard", href: "/user-dashboard", icon: AppWindowMac },
    // { key: "nav.adAccount", href: "/user-dashboard/ad-account", icon: ListChecks },
    { key: "nav.myTasks", href: "/user-dashboard/tasks", icon: ListChecks },
    // { key: "nav.referrals", href: "/user-dashboard/referrals", icon: Share2 },
    // { key: "nav.withdrawals", href: "/user-dashboard/withdrawals", icon: Send },
    { key: "nav.customerService", href: "/user-dashboard/chat", icon: MessageCircle, badgeKey: "unreadChat" },
    { key: "nav.profile", href: "/user-dashboard/profile", icon: User },
    { key: "nav.records", href: "/user-dashboard/records", icon: User },
];

const paymentChildren = [
    { key: "nav.addFund", href: "/user-dashboard/deposits" },
    { key: "sidebar.fundHistory", href: "/user-dashboard/payments" },
    { key: "nav.withdrawals", href: "/user-dashboard/withdrawals", icon: Send },
];

const balanceChildren = [
    { key: "sidebar.balanceOverview", href: "/user-dashboard/balance" },
    { key: "nav.balanceHistory", href: "/user-dashboard/balance-history" },
];

export default function UserSidebar({ open, onClose }) {
    const pathname = usePathname();
    const { unreadChat, unreadNotifications } = useUserNotifications();
    const { t } = useLanguage();
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
        <div className="hidden">
            <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/5 bg-gradient-to-b from-[#FFF7ED] via-[#FFFBF7] to-[#FFF7F0] text-slate-900 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <Link href="/">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-[#E05305]">Saffron Edge</p>
                            <h2 className="mt-1 text-lg font-semibold">{t("sidebar.yourDashboard")}</h2>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const active = pathname === item.href;
                            const Icon = item.icon;
                            const badgeCount = item.badgeKey === "unreadChat" ? unreadChat : 0;

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
                                    <span className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-white/10" : "bg-white/5"}`}>
                                        <Icon size={18} />
                                        {badgeCount > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
                                                {badgeCount > 99 ? "99+" : badgeCount}
                                            </span>
                                        )}
                                    </span>
                                    <span>{t(item.key)}</span>
                                    {badgeCount > 0 && (
                                        <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                            {badgeCount > 99 ? "99+" : badgeCount}
                                        </span>
                                    )}
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
                                <span className="flex-1 text-left">{t("sidebar.payments")}</span>
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
                                                    {t(child.key)}
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
                                <span className="flex-1 text-left">{t("sidebar.balance")}</span>
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
                                                    {t(child.key)}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Language */}
                        <LanguageSelector variant="light" />
                    </div>
                </nav>

                <div className="border-t border-slate-200 px-6 py-5">
                    {(unreadChat > 0 || unreadNotifications > 0) && (
                        <Link
                            href="/user-dashboard/chat"
                            className="mb-3 flex items-center gap-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 hover:bg-red-100/70 transition-colors"
                        >
                            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10">
                                <Bell size={16} className="text-red-500" />
                                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-red-500 rounded-full">
                                    {(unreadChat + unreadNotifications) > 99 ? "99+" : (unreadChat + unreadNotifications)}
                                </span>
                            </span>
                            <span className="text-xs font-semibold text-red-600">
                                {unreadChat > 0
                                    ? `${unreadChat} unread message${unreadChat > 1 ? "s" : ""}`
                                    : `${unreadNotifications} new notification${unreadNotifications > 1 ? "s" : ""}`}
                            </span>
                        </Link>
                    )}
                    <div className="rounded-lg bg-white p-3">
                        <p className="text-sm text-slate-700">{t("sidebar.needHelp")}</p>
                        <p className="mt-1 text-xs text-slate-500">{t("sidebar.contactSupport")}</p>
                    </div>
                </div>
            </aside>
        </div>
    );
}
