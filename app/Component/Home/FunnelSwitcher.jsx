"use client";

import React, { useState } from 'react';
import { Users, Target, Heart, X, Check, RefreshCw, Star, Zap } from 'lucide-react';

const FunnelSwitcher = () => {
    // কোন ট্যাবটি সিলেক্টেড আছে তা ট্র্যাক করার জন্য state (default: funnel)
    const [activeTab, setActiveTab] = useState('funnel');

    // ১. Traditional Funnel এর জন্য ডেটা
    const funnelData = {
        cards: [
            {
                icon: <Users size={22} className="text-blue-500" />,
                iconBg: "bg-blue-50",
                title: "Attract Visitors",
                desc: "High cost acquisition through paid ads",
                metric: "10,000",
                badge: "High CAC, Limited reach",
                badgeColor: "bg-red-50 text-red-600",
                progress: 100,
                progressColor: "bg-gray-200",
                isAlertCard: false
            },
            {
                icon: <Target size={22} className="text-purple-500" />,
                iconBg: "bg-purple-50",
                title: "Convert Leads",
                desc: "Basic landing pages with average conversion",
                metric: "1,500",
                badge: "Low conversion rates",
                badgeColor: "bg-red-50 text-red-600",
                progress: 40,
                progressColor: "bg-gray-200",
                isAlertCard: false
            },
            {
                icon: <Heart size={22} className="text-indigo-500" />,
                iconBg: "bg-indigo-50",
                title: "Close Customers",
                desc: "Manual sales process with high drop-off",
                metric: "300",
                badge: "Long sales cycles",
                badgeColor: "bg-red-50 text-red-600",
                progress: 15,
                progressColor: "bg-blue-500",
                isAlertCard: false
            },
            {
                icon: <X size={22} className="text-white" />,
                iconBg: "bg-red-600",
                title: "Customer Churn",
                desc: "Customers leave after initial purchase",
                metric: "50",
                badge: "No retention strategy",
                badgeColor: "bg-red-100/50 text-red-700",
                progress: 100,
                progressColor: "bg-red-600",
                isAlertCard: true // রেড বর্ডার ও লাইট রেড ব্যাকগ্রাউন্ডের জন্য
            }
        ],
        stats: [
            { value: "95%", label: "Customer Drop-off", color: "text-red-600" },
            { value: "High", label: "Customer Acquisition Cost", color: "text-red-600" },
            { value: "Flat", label: "Growth Rate", color: "text-red-600" }
        ]
    };

    // ২. Growth Loop এর জন্য ডেটা (স্যুইচ করলে যাতে নতুন ডেটা দেখায়)
    const growthLoopData = {
        cards: [
            {
                icon: <Zap size={22} className="text-amber-500" />,
                iconBg: "bg-amber-50",
                title: "Organic Influx",
                desc: "Compounding growth via word-of-mouth & invites",
                metric: "25,000",
                badge: "Low CAC, Viral channels",
                badgeColor: "bg-green-50 text-green-600",
                progress: 100,
                progressColor: "bg-green-500",
                isAlertCard: false
            },
            {
                icon: <Target size={22} className="text-emerald-500" />,
                iconBg: "bg-emerald-50",
                title: "High Conversion",
                desc: "Value-driven onboarding & loop design",
                metric: "8,000",
                badge: "Optimized user flows",
                badgeColor: "bg-green-50 text-green-600",
                progress: 75,
                progressColor: "bg-green-500",
                isAlertCard: false
            },
            {
                icon: <Star size={22} className="text-yellow-500" />,
                iconBg: "bg-yellow-50",
                title: "Delighted Users",
                desc: "Continuous value delivery & product love",
                metric: "6,200",
                badge: "High lifetime value",
                badgeColor: "bg-green-50 text-green-600",
                progress: 90,
                progressColor: "bg-green-500",
                isAlertCard: false
            },
            {
                icon: <Check size={22} className="text-white" />,
                iconBg: "bg-green-600",
                title: "Reinvestment Loop",
                desc: "Users naturally invite more users to join",
                metric: "+4,500",
                badge: "Self-sustaining flywheel",
                badgeColor: "bg-green-100/50 text-green-700",
                progress: 100,
                progressColor: "bg-green-600",
                isAlertCard: false,
                isSuccessCard: true // গ্রিন থিমের জন্য কাস্টম প্রোপার্টি
            }
        ],
        stats: [
            { value: "85%", label: "Retention Rate", color: "text-green-600" },
            { value: "Minimal", label: "Acquisition Cost", color: "text-green-600" },
            { value: "Exponential", label: "Growth Rate", color: "text-green-600" }
        ]
    };

    // বর্তমানের একটিভ ডেটা সিলেক্ট করা হচ্ছে
    const currentData = activeTab === 'funnel' ? funnelData : growthLoopData;

    return (
        <div className="bg-[#f3ebfb] pt-10 ">

            <section className="w-full bg-white py-16 px-4 md:px-8  mx-auto font-sans rounded-t-[120px]">
                <div className="w-full flex flex-col items-center text-center mb-10 ">

                    {/* হেডিং */}
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 flex items-center justify-center gap-2 tracking-tight">
                        Shift Funnels To Growth Loops
                        <span className="inline-block transform rotate-12 text-2xl">∞</span>
                    </h2>

                    {/* সাবহেডিং */}
                    <p className="text-gray-500 text-sm md:text-base max-w-3xl leading-relaxed mb-8 font-normal">
                        Traditional funnels leak customers. Our growth loops turn satisfied customers into your best acquisition channel, resulting in exponential growth.
                    </p>

                    {/* টগল বাটন কন্টেইনার */}
                    <div className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-1">
                        <button
                            onClick={() => setActiveTab('funnel')}
                            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${activeTab === 'funnel'
                                    ? 'bg-[#0E131F] text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            Traditional Funnel
                        </button>

                        <button
                            onClick={() => setActiveTab('loop')}
                            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${activeTab === 'loop'
                                    ? 'bg-[#0E131F] text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            Growth Loop
                        </button>
                    </div>
                </div>

                {/* ৪টি কার্ডের গ্রিড সেকশন */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6 max-w-7xl mx-auto px-4">
                    {currentData.cards.map((card, idx) => (
                        <div
                            key={idx}
                            className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-full min-h-[340px] bg-white ${card.isAlertCard
                                    ? 'border-red-400 bg-red-50/40 shadow-sm'
                                    : card.isSuccessCard
                                        ? 'border-green-400 bg-green-50/40 shadow-sm'
                                        : 'border-gray-100 shadow-sm hover:shadow-md'
                                }`}
                        >
                            {/* কার্ডের উপরের অংশ */}
                            <div>
                                {/* আইকন বক্স */}
                                <div className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center mb-5 shadow-sm`}>
                                    {card.icon}
                                </div>

                                {/* টাইটেল এবং শর্ট ডেসক্রিপশন */}
                                <h4 className="text-gray-900 font-extrabold text-lg mb-2 tracking-tight">{card.title}</h4>
                                <p className="text-gray-500 text-sm font-normal leading-normal mb-6">{card.desc}</p>
                            </div>

                            {/* কার্ডের নিচের ম্যাট্রিক্স পার্ট */}
                            <div>
                                <div className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">{card.metric}</div>

                                {/* রেড/গ্রিন এলার্ট ব্যাজ */}
                                <div className={`text-xs font-semibold py-1.5 px-3 rounded-md mb-4 inline-block tracking-wide ${card.badgeColor}`}>
                                    {card.badge}
                                </div>

                                {/* কাস্টম প্রোগ্রেস বার */}
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${card.progressColor}`}
                                        style={{ width: `${card.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* নিচের ৩টি স্ট্যাটস বক্স (Bottom Stats Section) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto px-4">
                    {currentData.stats.map((stat, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center flex flex-col justify-center items-center min-h-[110px]">
                            <div className={`text-2xl md:text-3xl font-extrabold mb-1 tracking-tight ${stat.color}`}>
                                {stat.value}
                            </div>
                            <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

        </div>

    );
};

export default FunnelSwitcher;