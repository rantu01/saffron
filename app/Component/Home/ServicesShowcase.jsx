"use client";

import React, { useState } from 'react';
import {
    Search, Users, Settings, Megaphone, BarChart2,
    FileText, LineChart, CheckCircle, TrendingUp
} from 'lucide-react';
import Link from 'next/link';

const ServicesShowcase = () => {
    // কোন ট্যাবটি একটিভ আছে তা ট্র্যাক করার জন্য state
    const [activeTab, setActiveTab] = useState('seo');

    // ১. সকল সার্ভিসের ডাইনামিক ডেটা অবজেক্ট
    const servicesData = {
        seo: {
            id: 'seo',
            title: "SEO Services",
            subtitle: "Get High-intent Traffic",
            icon: <Search size={20} />,
            desc: "Nowadays, most brands have stopped showing up where buyers ask. Traditional SEO isn't enough. We help you 3X visibility on Search Engines, LLMs, and Socials.",
            features: ["Traditional SEO", "Answer Engine Optimization", "Generative Engine Optimization", "Voice Search Optimization"],
            resultValue: "4x",
            resultLabel: "increase in organic traffic"
        },
        abm: {
            id: 'abm',
            title: "ABM Intelligence",
            subtitle: "Find The Right Account",
            icon: <Users size={20} />,
            desc: "Target high-value accounts with precision. Our Account-Based Marketing intelligence connects your sales and marketing teams to close bigger enterprise deals faster.",
            features: ["Account Identification", "Intent Data Analysis", "Personalized Campaigns", "B2B Pipeline Tracking"],
            resultValue: "2.5x",
            resultLabel: "higher deal win-rates"
        },
        automation: {
            id: 'automation',
            title: "Marketing Automation",
            subtitle: "Engage Your Users Better",
            icon: <Settings size={20} />,
            desc: "Streamline your marketing workflows. Build automated nurture campaigns that guide your leads perfectly through the funnel without manual intervention.",
            features: ["Email Nurture Loops", "Lead Scoring Systems", "CRM Integrations", "Behavioral Triggers"],
            resultValue: "60%",
            resultLabel: "reduction in sales cycle time"
        },
        performance: {
            id: 'performance',
            title: "Performance Marketing",
            subtitle: "Improve Your Ad Clicks",
            icon: <Megaphone size={20} />,
            desc: "Stop wasting budget on empty clicks. We design high-ROI paid campaigns focused entirely on conversion, scale, and sustainable acquisition cost.",
            features: ["Paid Search & Social", "Ad Creative Optimization", "A/B Audience Testing", "Retargeting Funnels"],
            resultValue: "35%",
            resultLabel: "drop in Customer Acquisition Cost"
        },
        cro: {
            id: 'cro',
            title: "Conversion Rate Optimization",
            subtitle: "Get More MQLs from Website",
            icon: <BarChart2 size={20} />,
            desc: "Turn your existing traffic into revenue. We analyze user behavior, heatmaps, and drop-off points to optimize your landing pages for maximum signups.",
            features: ["User Behavior Analysis", "A/B Page Testing", "UX/UI Enhancements", "Form Flow Optimization"],
            resultValue: "52%",
            resultLabel: "increase in form conversions"
        },
        content: {
            id: 'content',
            title: "Content Marketing",
            subtitle: "Better Nurturing. More Clicks.",
            icon: <FileText size={20} />,
            desc: "Content that establishes authority and drives intent. We produce research-backed blogs, whitepapers, and assets that your target audience actually wants to read.",
            features: ["SEO Content Strategy", "Thought Leadership", "Lead Magnets & eBooks", "Distribution Planning"],
            resultValue: "3x",
            resultLabel: "more qualified pipeline leads"
        },
        analytics: {
            id: 'analytics',
            title: "Marketing Analytics & Dashboard",
            subtitle: "Make Insightful Decisions",
            icon: <LineChart size={20} />,
            desc: "Eliminate the guesswork. We build centralized custom marketing dashboards so you can see exactly where every single dollar is working for your business.",
            features: ["Multi-Touch Attribution", "Custom ROI Dashboards", "Data Pipeline Syncing", "Predictive Forecasting"],
            resultValue: "100%",
            resultLabel: "data transparency & tracking"
        }
    };

    // ট্যাব লিস্ট তৈরির জন্য ডিক্লেয়ারেশন
    const tabKeys = Object.keys(servicesData);
    const activeContent = servicesData[activeTab];

    return (
        <section className="relative w-full bg-[#f3ebfb] mx-auto font-sans overflow-hidden">
            <div className="relative  mx-auto w-full">
                <div className="relative bg-white  rounded-b-[120px] rounded-t-lg p-8 md:p-12">

                    <div className="mx-auto w-full max-w-7xl px-4 flex flex-col items-center">
                        {/* ১. টপ হেডার সেকশন */}
                        <div className="w-full text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                                Everything You Need to Dominate Your Market
                            </h2>
                            <p className="text-gray-500 text-sm md:text-base max-w-3xl mx-auto leading-relaxed font-normal">
                                Saffron Edge provides comprehensive marketing solutions that work together to create unstoppable growth momentum for your business.
                            </p>
                        </div>

                        {/* ২. ইন্টারেক্টিভ ট্যাব এবং ডিসপ্লে গ্রিড */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">

                            {/* বাম দিকের কলাম: ট্যাব লিস্ট (৫ স্প্যান) */}
                            <div className="lg:col-span-5 flex flex-col gap-3 w-full">
                                {tabKeys.map((key) => {
                                    const tab = servicesData[key];
                                    const isSelected = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all duration-200 ${isSelected
                                                ? 'border-l-[4px] border-l-black border-gray-200 bg-[#F4FAFF] shadow-sm'
                                                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'
                                                }`}
                                        >
                                            {/* ট্যাব আইকন */}
                                            <div className={`p-2.5 rounded-lg ${isSelected ? 'text-blue-500 bg-blue-50' : 'text-gray-400 bg-gray-50'}`}>
                                                {tab.icon}
                                            </div>
                                            {/* ট্যাব টেক্সট */}
                                            <div>
                                                <h4 className="text-gray-900 font-bold text-sm md:text-base">{tab.title}</h4>
                                                <p className="text-gray-400 text-xs mt-0.5 font-normal">{tab.subtitle}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ডান দিকের কলাম: ডাইনামিক ডিসপ্লে বক্স (৭ স্প্যান) */}
                            <div className="lg:col-span-7 border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col justify-between h-full min-h-[580px]">

                                {/* ডিসপ্লের উপরের নীল অংশ */}
                                <div className="p-8 bg-[#F4FAFF] border-b border-gray-100/50">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-11 h-11 bg-[#2996E6] text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/10">
                                            {activeContent.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">{activeContent.title}</h3>
                                            <p className="text-gray-500 text-xs md:text-sm font-medium mt-0.5">{activeContent.subtitle}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm md:text-base leading-relaxed font-normal mb-6">
                                        {activeContent.desc}
                                    </p>
                                    <Link
                                        href={`/services/${activeContent.id}`}
                                        className="inline-block border border-[#E05305] text-[#E05305] font-bold text-xs px-5 py-2 rounded-md hover:bg-orange-50/40 transition-colors"
                                    >
                                        Learn More
                                    </Link>
                                </div>

                                {/* ডিসপ্লের নিচের সাদা অংশ (Features, Expected Results, Case Study) */}
                                <div className="p-8 bg-white flex-1 flex flex-col justify-between gap-8">

                                    {/* কি-ফিচার এবং রেজাল্ট রো */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                        {/* কি ফিচার লিস্ট */}
                                        <div className="md:col-span-7">
                                            <h5 className="text-gray-900 font-extrabold text-base mb-3 flex items-center gap-2">
                                                <CheckCircle size={16} className="text-[#E05305]" /> Key Features
                                            </h5>
                                            <ul className="space-y-2 text-sm text-gray-500 font-medium">
                                                {activeContent.features.map((feat, i) => (
                                                    <li key={i} className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" /> {feat}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* এক্সপেক্টেড রেজাল্ট বক্স */}
                                        <div className="md:col-span-5 w-full">
                                            <h5 className="text-gray-900 font-extrabold text-base mb-3 flex items-center gap-2">
                                                <TrendingUp size={16} className="text-emerald-500" /> Expected Results
                                            </h5>
                                            <div className="border border-emerald-500 rounded-xl p-4 bg-white flex flex-col justify-center min-h-[90px]">
                                                <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">{activeContent.resultValue}</span>
                                                <span className="text-xs font-semibold text-emerald-600 mt-0.5 leading-tight">{activeContent.resultLabel}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* কেস স্টাডি প্রিভিউ ফুটার */}
                                    <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <h5 className="text-gray-900 font-extrabold text-base mb-1">Case Study Preview</h5>
                                            <p className="text-gray-400 text-xs md:text-sm font-normal">
                                                See how companies like yours achieved similar results with Saffron Edge.
                                            </p>
                                        </div>
                                        <Link
                                            href="/case-studies"
                                            className="border border-[#E05305] text-[#E05305] font-bold text-xs px-5 py-2.5 rounded-md hover:bg-orange-50/40 text-center whitespace-nowrap transition-colors"
                                        >
                                            View Case Study
                                        </Link>
                                    </div>

                                </div>
                            </div>

                        </div>

                        {/* ৩. নিচের গ্লোবাল কল-টু-অ্যাকশন ব্লক (Bottom CTA Box) */}
                        <div className="w-full bg-[#FFF5EF] border border-orange-200/60 rounded-xl p-8 md:p-12 text-center flex flex-col items-center shadow-sm">
                            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
                                Tried everything but nothing works?
                            </h3>
                            <p className="text-gray-600 text-sm md:text-base max-w-4xl leading-relaxed mb-8 font-normal">
                                Since 2008, we've helped 2,500+ brands scale with our modern GTM strategies designed for marketing <br className="hidden md:block" />
                                that drives the business. Your brand could be the next.
                            </p>
                            <Link
                                href="/growth-plan"
                                className="bg-[#E05305] text-white font-bold px-8 py-3.5 rounded-lg shadow-md hover:bg-[#c84a04] transition-all text-sm md:text-base"
                            >
                                Get Your Custom Growth Plan
                            </Link>
                        </div>
                    </div>

                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50/30 to-transparent pointer-events-none" />
        </section>
    );
};

export default ServicesShowcase;