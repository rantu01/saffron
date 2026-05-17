"use client";

import React from 'react';
import Link from 'next/link';

const SeoTruthsShowcase = () => {
  // ৩টি প্রধান কার্ডের ডেটা অবজেক্ট অ্যারে
  const truthsData = [
    {
      problem: '"Our traffic is growing, but conversions aren\'t."',
      solution: "You may be ranking for irrelevant terms. Semantic SEO helps you align visibility with buyer intent and actual questions."
    },
    {
      problem: '"We publish content, but it doesn\'t rank."',
      solution: "Generic blogs don't compete. We build semantically rich clusters that help search engines map your authority across topics."
    },
    {
      problem: '"Google still doesn\'t know what we do."',
      solution: "That's a structure issue. Our semantic SEO services build clarity into your site using internal links, entities, and markup."
    }
  ];

  return (
    <section className="w-full bg-white py-16 px-4 md:px-8 max-w-7xl mx-auto font-sans">
      
      {/* ১. টপ হেডার সেকশন */}
      <div className="w-full text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-4 tracking-tight">
          Here's the Brutal Truth About Most SEO Services
        </h2>
        <p className="text-gray-500 text-sm md:text-base max-w-4xl mx-auto leading-relaxed font-normal">
          Most SEO companies optimize for keywords, not understanding. But Google ranks meaning, not just matches.
        </p>
      </div>

      {/* ২. ৩টি বিশেষ টু-টোন কার্ডের গ্রিড লেআউট */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {truthsData.map((card, idx) => (
          <div 
            key={idx} 
            className="w-full bg-[#EBF5FF]/40 border-2 border-[#2996E6]/60 rounded-2xl p-5 flex flex-col h-full min-h-[300px] justify-between shadow-xs"
          >
            {/* কার্ডের ওপরের অংশ: পেইন পয়েন্ট বা সমস্যা */}
            <div className="pt-2 pb-6 px-2">
              <h3 className="text-gray-950 font-extrabold text-lg md:text-[20px] leading-snug tracking-tight">
                {card.problem}
              </h3>
            </div>

            {/* কার্ডের নিচের অংশ: সাদা ব্যাকগ্রাউন্ডের সমাধান বক্স */}
            <div className="bg-white rounded-xl p-5 border border-blue-50/20 flex-1 flex items-center shadow-xs">
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed font-normal">
                {card.solution}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ৩. নিচের গ্লোবাল কল-টু-অ্যাকশন ব্লক (Bottom CTA Box) */}
      <div className="w-full bg-[#FFF5EF] border border-orange-200/60 rounded-xl p-8 md:p-10 text-center flex flex-col items-center shadow-2xs max-w-7xl mx-auto">
        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Be Found for What You Actually Mean
        </h3>
        <p className="text-gray-500 text-sm md:text-base max-w-3xl leading-relaxed mb-6 font-normal">
          Search engines are smarter now. We help them understand your brand, content, and value, at scale.
        </p>
        <Link 
          href="/brand-authority"
          className="bg-[#E05305] text-white font-extrabold px-8 py-3.5 rounded-lg shadow-md hover:bg-[#c84a04] transition-all text-xs md:text-sm tracking-wide"
        >
          Build Brand Authority
        </Link>
      </div>

    </section>
  );
};

export default SeoTruthsShowcase;