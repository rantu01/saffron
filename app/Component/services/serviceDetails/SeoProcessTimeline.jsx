"use client";

import React, { useMemo } from 'react';
import { Map, FileText, CheckCircle2, Search, Layers3, Rocket } from 'lucide-react';

const SeoProcessTimeline = () => {
    const stepsData = useMemo(() => ([
        {
            id: 1,
            title: 'Discovery & Mapping',
            desc: 'We audit your existing pages, extract topic entities, and blueprint your authority potential.',
            icon: <Map size={22} className="text-[#E05305]" />,
            iconBg: 'bg-[#FFF5EF]',
            position: 'right',
            features: ['Topic + intent inventory', 'Existing content scorecard', 'Internal link analysis', 'NLP output match rate'],
        },
        {
            id: 2,
            title: 'Semantic Content Planning',
            desc: 'We build authoritative content structures, identifying critical semantic gaps to drive predictable topical loops.',
            icon: <FileText size={22} className="text-gray-400" />,
            iconBg: 'bg-gray-50',
            position: 'left',
            features: ['Pillar & cluster structuring', 'Semantic keyword alignment', 'Competitor gap diagnostics'],
        },
        {
            id: 3,
            title: 'Entity Research & SERP Analysis',
            desc: 'We map entities, search intent, and live SERP signals to align content with how Google understands your niche.',
            icon: <Search size={22} className="text-gray-400" />,
            iconBg: 'bg-gray-50',
            position: 'right',
            features: ['SERP pattern review', 'Entity gap identification', 'Intent clustering'],
        },
        {
            id: 4,
            title: 'Content Architecture & Internal Links',
            desc: 'We connect your pages into a deliberate information architecture that improves crawlability and topical depth.',
            icon: <Layers3 size={22} className="text-gray-400" />,
            iconBg: 'bg-gray-50',
            position: 'left',
            features: ['Topic hub design', 'Internal link routing', 'Support page prioritization'],
        },
        {
            id: 5,
            title: 'Execution & Iteration',
            desc: 'We publish, monitor, and refine based on performance signals so the strategy keeps compounding over time.',
            icon: <Rocket size={22} className="text-gray-400" />,
            iconBg: 'bg-gray-50',
            position: 'right',
            features: ['Publishing roadmap', 'Performance tracking', 'Continuous optimization'],
        },
    ]), []);

    return (

        <div className="bg-[#f3ebfb]">
            <section className="w-full bg-white py-16 px-4 md:px-8  font-sans relative rounded-t-[120px]">

                {/* ১. টপ হেডার সেকশন */}
                <div className="w-full text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-4 tracking-tight">
                        How Our Semantic SEO Agency Builds <br />
                        Relevance from the Ground Up?
                    </h2>
                    <p className="text-gray-500 text-sm md:text-base max-w-3xl mx-auto leading-relaxed font-normal">
                        We turn your website into a concept-driven, search-aware framework that speaks Google's language and delivers meaning, not just keywords.
                    </p>
                </div>

                {/* ২. টাইমলাইন রোডম্যাপ কন্টেইনার */}
                <div className="relative w-full max-w-7xl mx-auto pb-12 px-6">
                    <div className="relative h-[29rem] md:h-[31rem] overflow-y-auto pr-2 scroll-smooth scrollbar-none snap-y snap-mandatory">
                        <div className="relative flex flex-col gap-10 md:gap-6 pb-12">

                            {/* মাঝখানের সুক্ষ্ম টাইমলাইন লাইন (ডেক্সটপ ভিউর জন্য) */}
                            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[1.5px] bg-gray-300 transform md:-translate-x-1/2 z-0" />

                            {/* লুপের মাধ্যমে প্রতিটি স্টেপ রেন্ডার করা হচ্ছে */}
                            {stepsData.map((step) => {
                                const isRight = step.position === 'right';
                                const isActive = step.id === 1;

                                return (
                                    <div
                                        key={step.id}
                                        className={`relative w-full flex flex-col md:flex-row items-start z-10 snap-start min-h-[13rem] ${isRight ? 'md:justify-end' : 'md:justify-start'
                                            }`}
                                    >
                                        {/* টাইমলাইন সার্কেল ব্যাজ (১, ২ নম্বর সূচক) */}
                                        <div
                                            className={`absolute left-0 md:left-1/2 w-9 h-9 rounded-full flex items-center justify-center font-bold text-base border shadow-xs transform -translate-x-0 md:-translate-x-1/2 transition-colors duration-300 ${isActive
                                                ? 'bg-[#FFEFE4] text-gray-950 border-orange-200'
                                                : 'bg-white text-gray-400 border-gray-200'
                                                }`}
                                        >
                                            {step.id}
                                        </div>

                                        {/* প্রসেস কন্টেন্ট কার্ড */}
                                        <div
                                            className={`w-full md:w-[46%] pl-12 md:pl-0 border border-gray-100/80 rounded-2xl bg-white shadow-md shadow-gray-100/40 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                                                }`}
                                        >
                                            {/* কার্ড হেডার পার্ট */}
                                            <div className="p-5 md:p-6 flex items-center gap-4 border-b border-gray-100/60">
                                                <div className={`w-11 h-11 ${step.iconBg} rounded-xl flex items-center justify-center shadow-2xs`}>
                                                    {step.icon}
                                                </div>
                                                <h3 className="text-gray-950 font-extrabold text-lg md:text-[20px] tracking-tight">
                                                    {step.title}
                                                </h3>
                                            </div>

                                            {/* কার্ড বডি পার্ট (একটিভ কার্ডের ভেতরের ফিচার লিস্টসহ) */}
                                            <div className="p-6 flex flex-col gap-5">
                                                <p className="text-gray-500 text-sm leading-relaxed font-normal">
                                                    {step.desc}
                                                </p>

                                                {/* ২-কলামের ফিচারড চেকমার্ক লিস্ট (যদি ডেটাতে থাকে) */}
                                                {step.features && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 pt-2 border-t border-gray-50/50">
                                                        {step.features.map((feat, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-gray-500 text-xs font-semibold tracking-wide">
                                                                <CheckCircle2 size={15} className="text-[#E05305] flex-shrink-0" />
                                                                <span className="whitespace-nowrap">{feat}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}

                        </div>
                    </div>
                </div>

                <p className="mt-4 text-center text-xs md:text-sm text-gray-400">
                    Use your mouse wheel inside this area to reveal the next steps.
                </p>



                {/* ৩. বটম "Get Free Quote" বাটন উইথ কাস্টম ৩ডি প্রেশার শ্যাডো */}
                <div className="w-full flex justify-center pt-8 relative z-20">
                    <button
                        className="bg-[#E05305] text-white font-extrabold text-sm md:text-base px-8 py-3.5 rounded-lg shadow-[0_4px_0_0_#c84a04] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#c84a04] active:translate-y-[4px] active:shadow-none transition-all text-center min-w-[180px]"
                    >
                        Get Free Quote
                    </button>
                </div>

            </section>
        </div>

    );
};

export default SeoProcessTimeline;