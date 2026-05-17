"use client";

import React from 'react';
import Link from 'next/link';

const GrowthHero = () => {
  return (
    <section className="w-full bg-white py-16 px-6 md:px-12 lg:px-24 flex items-center min-h-[85vh] font-sans relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full relative z-10">
        
        {/* বাম দিকের কলাম: টেক্সট কনটেন্ট ও বাটন (৭ স্প্যান) */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {/* মেইন বোল্ড হেডিং */}
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-gray-950 leading-[1.15] tracking-tight mb-6">
            We Scale Your Growth <br />
            Marketing Efforts with <br />
            Our In-House Experts.
          </h1>

          {/* সাব-ডেসক্রিপশন */}
          <p className="text-gray-500 text-sm md:text-base max-w-2xl leading-relaxed font-normal mb-10">
            Reduce the risk of overspending on marketing and make each buck count 
            through our full-service marketing solutions, ABM, Attribution, and Automation.
          </p>

          {/* কল-টু-অ্যাকশন বাটনসমূহ */}
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-12">
            {/* Get Started Button */}
            <Link 
              href="/get-started"
              className="bg-[#E05305] text-white font-extrabold text-sm md:text-base px-8 py-3.5 rounded-md hover:bg-[#c84a04] transition-all text-center min-w-[150px] tracking-wide uppercase"
            >
              Get Started
            </Link>

            {/* Our Work Outline Button */}
            <Link 
              href="/our-work"
              className="bg-white text-[#E05305] border-2 border-[#E05305] font-extrabold text-sm md:text-base px-8 py-3 rounded-md hover:bg-orange-50/40 transition-all text-center min-w-[150px] tracking-wide uppercase"
            >
              Our Work
            </Link>
          </div>

          {/* ক্লাচ রেটিং উইজেট (Clutch Rating) */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 w-full sm:w-auto">
            {/* ডামি ক্লাচ লোগো এবং রেটিং */}
            <div className="text-2xl font-black text-[#142A3A] tracking-tighter flex items-center gap-1 select-none">
              Clutch
              <span className="w-3 h-3 bg-[#E05305] rounded-full inline-block"></span>
            </div>
            <div className="flex flex-col items-start leading-none">
              <div className="text-yellow-400 text-sm tracking-tighter mb-0.5">⭐⭐⭐⭐⭐</div>
              <span className="text-[11px] font-bold text-gray-500">4.8 Rating</span>
            </div>
          </div>
        </div>

        {/* ডান দিকের কলাম: ইলাস্ট্রেশন ও গ্রাফিক্যাল মকআপ (৫ স্প্যান) */}
        <div className="lg:col-span-5 w-full flex justify-center items-center relative min-h-[400px]">
          {/* ব্যাকগ্রাউন্ড অরেঞ্জ রম্বস/ডায়মন্ড শেপ */}
          <div className="absolute w-72 h-72 bg-[#FFEFE4] rounded-3xl transform rotate-45 -z-10 opacity-70" />

          {/* মূল ইমেজ হোল্ডার (ব্যক্তি এবং ল্যাপটপ) */}
          <div className="relative w-full max-w-[380px] z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop" // ফরমাল ডামি ইমেজ (ল্যাপটপ সহ ব্যক্তির জন্য)
              alt="In-house growth expert" 
              className="w-full h-[400px] object-contain rounded-2xl drop-shadow-2xl"
            />

            {/* উপরের বাম পাশের ৪৮k ভিজিটর গ্রাফ কার্ড */}
            <div className="absolute -top-10 -left-12 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 flex flex-col gap-2 w-48 pointer-events-none transform scale-90 md:scale-100">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400">Daily Analytics</span>
                <span className="bg-orange-50 text-[#E05305] text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  48k <span className="text-[7px]">▲</span>
                </span>
              </div>
              {/* মিনি লাইভ গ্রাফ লাইন আর্ট (SVG) */}
              <svg viewBox="0 0 100 30" className="w-full h-8 stroke-blue-400 stroke-[2] fill-none">
                <path d="M0 25 Q15 5, 30 20 T60 10 T90 5 T100 15" />
              </svg>
            </div>

            {/* নিচের ডান পাশের ৮০০+ ডেইলি ভিজিটর ব্যাজ */}
            <div className="absolute -bottom-4 -right-8 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex flex-col items-start min-w-[120px] pointer-events-none">
              <span className="text-[10px] font-bold text-gray-400 leading-none mb-1">Daily Visitor</span>
              <span className="text-2xl font-black text-[#2996E6] tracking-tight">800+</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default GrowthHero;