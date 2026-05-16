"use client";

import React, { useState } from 'react';
import { Code2, Factory, HeartPulse, Truck } from 'lucide-react';

const IndustryShowcase = () => {
    // কোন ইন্ডাস্ট্রি ট্যাবটি অ্যাক্টিভ আছে তা ট্র্যাক করার জন্য state
    const [activeTab, setActiveTab] = useState('saas');

    // সকল ইন্ডাস্ট্রির ডাইনামিক ডেটা অবজেক্ট
    const industryData = {
        saas: {
            id: 'saas',
            title: "Drove 15X SaaS Lead Growth in Just 12 Months through Semantic SEO, Targeted Content, & High-Impact CRO",
            desc: "Even with a great product, JOP struggled with limited website traffic and engagement — mainly due to over-reliance on technical SEO. That's when they partnered with Saffron Edge to drive real growth.",
            image: "https://via.placeholder.com/550x380/ffffff/a3a3a3?text=SaaS+Dashboard+Mockup", // এখানে আপনার প্রজেক্টের আসল ড্যাশবোর্ড স্ক্রিনশট বা ইমেজ পাথ দেবেন
            stats: [
                { value: "522%", label: "Growth in Organic Traffic" },
                { value: "99x", label: "Increase in Keywords Ranking on Page 1" },
                { value: "15x", label: "Year-over-Year SEO Growth" }
            ]
        },
        manufacturing: {
            id: 'manufacturing',
            title: "Scaled B2B Manufacturing Inquiries by 210% Using Account-Based Marketing and Hyper-Targeted Paid Campaigns",
            desc: "A leading industrial equipment manufacturer needed to reach high-value decision makers. We built a custom ABM pipeline that bypassed generic traffic and connected directly with enterprise buyers.",
            image: "https://via.placeholder.com/550x380/ffffff/a3a3a3?text=Manufacturing+Case+Mockup",
            stats: [
                { value: "210%", label: "Increase in Qualified Inquiries" },
                { value: "45%", label: "Reduction in Cost Per Acquisition" },
                { value: "$2.4M", label: "Pipeline Value Generated" }
            ]
        },
        healthcare: {
            id: 'healthcare',
            title: "Boosted Patient Acquisitions by 4.5X via Local SEO, Patient-First Content Loops, and Reputation Management",
            desc: "With strict compliance laws, healthcare marketing requires precision. We redesigned their local search footprint and optimized booking flows to turn high-intent searches into scheduled appointments.",
            image: "https://via.placeholder.com/550x380/ffffff/a3a3a3?text=Healthcare+Case+Mockup",
            stats: [
                { value: "4.5x", label: "Boost in Patient Acquisitions" },
                { value: "+180%", label: "Local Search Visibility" },
                { value: "12k+", label: "Monthly Online Bookings" }
            ]
        },
        supplychain: {
            id: 'supplychain',
            title: "Optimized Logistics Pipeline to Secure 30+ Enterprise Contracts with Content-Driven Funnels",
            desc: "Supply chain and logistics sales cycles are notoriously long. Saffron Edge developed a data-driven thought leadership strategy that nurtured enterprise leads from cold awareness to closed deals.",
            image: "https://via.placeholder.com/550x380/ffffff/a3a3a3?text=Supply+Chain+Mockup",
            stats: [
                { value: "32", label: "Enterprise Contracts Signed" },
                { value: "4x", label: "Content ROI Increase" },
                { value: "-30 Days", label: "Average Sales Cycle Shortened" }
            ]
        }
    };

    const currentContent = industryData[activeTab];

    return (
        // বাইরের মূল ব্যাকগ্রাউন্ড (হালকা বেগুনি টোন, যা স্ক্রিনের চারপাশ জুড়ে থাকবে)
        <div className="w-full bg-[#f3ebfb]">

            {/* ছবির মতো সাদা মেইন বক্স—যার ওপরের কোনাগুলো বড় কার্ভ বা রাউন্ডেড (`rounded-t-[40px]`) */}
            <section className="w-full bg-white rounded-t-[120px] py-16 px-6 md:px-12  mx-auto font-sans ">

                <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
                    {/* ১. টপ হেডার সেকশন */}
                    <div className="w-full text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-4 tracking-tight">
                            Experience our hypergrowth marketing systems
                        </h2>
                        <p className="text-gray-500 text-sm md:text-base max-w-4xl mx-auto leading-relaxed font-normal">
                            Industries such as healthcare, SaaS, e-commerce, legal, and manufacturing are among the top sectors that have benefitted the most from our digital marketing solutions.
                        </p>
                    </div>

                    {/* ২. হরিজন্টাল ট্যাব বাটনসমূহ */}
                    <div className="w-full max-w-3xl mx-auto flex flex-wrap justify-center items-center gap-2 md:gap-4 mb-0 relative z-10">

                        {/* B2B SaaS Tab */}
                        <button
                            onClick={() => setActiveTab('saas')}
                            className={`flex items-center gap-2 px-6 py-3.5 font-extrabold text-sm md:text-base rounded-t-xl border-t border-x transition-all duration-200 ${activeTab === 'saas'
                                    ? 'bg-[#E3F2FD] border-gray-200/60 text-gray-950'
                                    : 'bg-white border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            <Code2 size={18} /> B2B SaaS
                        </button>

                        {/* Manufacturing Tab */}
                        <button
                            onClick={() => setActiveTab('manufacturing')}
                            className={`flex items-center gap-2 px-6 py-3.5 font-extrabold text-sm md:text-base rounded-t-xl border-t border-x transition-all duration-200 ${activeTab === 'manufacturing'
                                    ? 'bg-[#E3F2FD] border-gray-200/60 text-gray-950'
                                    : 'bg-white border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            <Factory size={18} /> Manufacturing
                        </button>

                        {/* Healthcare Tab */}
                        <button
                            onClick={() => setActiveTab('healthcare')}
                            className={`flex items-center gap-2 px-6 py-3.5 font-extrabold text-sm md:text-base rounded-t-xl border-t border-x transition-all duration-200 ${activeTab === 'healthcare'
                                    ? 'bg-[#E3F2FD] border-gray-200/60 text-gray-950'
                                    : 'bg-white border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            <HeartPulse size={18} /> Healthcare
                        </button>

                        {/* Supply Chain Tab */}
                        <button
                            onClick={() => setActiveTab('supplychain')}
                            className={`flex items-center gap-2 px-6 py-3.5 font-extrabold text-sm md:text-base rounded-t-xl border-t border-x transition-all duration-200 ${activeTab === 'supplychain'
                                    ? 'bg-[#E3F2FD] border-gray-200/60 text-gray-950'
                                    : 'bg-white border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            <Truck size={18} /> Supply Chain
                        </button>

                    </div>

                    {/* ৩. লাইট ব্লু ইনার ডিসপ্লে বক্স (Inner Content Box) */}
                    <div className="w-full bg-[#E3F2FD] rounded-2xl md:rounded-[24px] p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-blue-100/30">

                        {/* বাম দিকের কনটেন্ট এরিয়া (৭ স্প্যান) */}
                        <div className="lg:col-span-7 flex flex-col justify-center">
                            <h3 className="text-xl md:text-2xl lg:text-[26px] font-extrabold text-gray-950 leading-[1.3] mb-5 tracking-tight">
                                {currentContent.title}
                            </h3>
                            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-8 font-normal max-w-2xl">
                                {currentContent.desc}
                            </p>

                            {/* ৩টি হোয়াইট স্ট্যাটস কার্ড গ্রিড */}
                            <div className="grid grid-cols-3 gap-3 md:gap-4 w-full">
                                {currentContent.stats.map((stat, i) => (
                                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-blue-50 text-center flex flex-col justify-center min-h-[105px]">
                                        <span className="text-xl md:text-2xl font-extrabold text-[#E05305] tracking-tight mb-1">
                                            {stat.value}
                                        </span>
                                        <span className="text-[10px] md:text-xs text-gray-500 font-semibold leading-tight px-1">
                                            {stat.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ডান দিকের ইমেজ/মকআপ এরিয়া (৫ স্প্যান) */}
                        <div className="lg:col-span-5 w-full flex justify-center">
                            <div className="relative w-full rounded-2xl overflow-hidden shadow-xl shadow-blue-900/10 border border-white/60 bg-white p-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={currentContent.image}
                                    alt={`${activeTab} performance dashboard`}
                                    className="w-full h-auto object-cover rounded-xl"
                                />
                            </div>
                        </div>

                    </div>
                </div>

            </section>
        </div>
    );
};

export default IndustryShowcase;