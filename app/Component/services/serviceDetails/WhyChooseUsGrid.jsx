import React from 'react';
import { Search, Award, TrendingUp, Cpu, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const WhyChooseUsGrid = () => {
  // ৬টি কার্ডের ভিন্ন ভিন্ন ব্যাকগ্রাউন্ড শেড ও কন্টেন্ট ডেটা অবজেক্ট অ্যারে
  const featuresData = [
    {
      badge: "Structured Concepts",
      title: "Semantic-First Frameworks",
      desc: "We design SEO systems tailored for recurring-revenue SaaS, mapped to ICP journeys, onboarding moments, and lifetime value.",
      icon: <Search size={22} className="text-white" />,
      iconBg: "bg-[#2996E6]", 
      topBg: "bg-[#E4F3FF]",   
    },
    {
      badge: "Across 12+ Industries",
      title: "Multi-Industry Experience",
      desc: "From SaaS onboarding to eCom product data, we scale semantic frameworks that match every niche.",
      icon: <Award size={22} className="text-white" />,
      iconBg: "bg-[#D66D26]", 
      topBg: "bg-[#FFF0E4]",   
    },
    {
      badge: "Engine-Friendly Content",
      title: "Faster Context Recognition",
      desc: "We bake semantic clarity into your layout, meta, copy, and markup for faster interpretation.",
      icon: <TrendingUp size={22} className="text-white" />,
      iconBg: "bg-[#4B56FF]", 
      topBg: "bg-[#EAEBFF]",   
    },
    {
      badge: "Built for AI Discovery",
      title: "NLP & Schema Experts",
      desc: "From AEO to GEO, we future-proof your content so it ranks in both traditional search and AI-powered interfaces.",
      icon: <Cpu size={22} className="text-white" />,
      iconBg: "bg-[#9A5BFF]", 
      topBg: "bg-[#F3EAFF]",   
    },
    {
      badge: "In-House SEO & Writers",
      title: "Team Integration",
      desc: "We don't replace your team, we supercharge it with playbooks built around semantic search best practices.",
      icon: <Users size={22} className="text-white" />,
      iconBg: "bg-[#D66D26]", 
      topBg: "bg-[#FFF0E4]",   
    },
    {
      badge: "End-to-end monitoring",
      title: "Transparent Reporting",
      desc: "We craft marketing We track how your content improves in semantic accuracy, indexing efficiency, and SERP trustworthiness.",
      icon: <BarChart3 size={22} className="text-white" />,
      iconBg: "bg-[#2996E6]", 
      topBg: "bg-[#E4F3FF]",   
    }
  ];

  return (
    <section className="w-full bg-white py-16 px-4 md:px-8 max-w-7xl mx-auto font-sans">
      
      {/* ১. টপ হেডার সেকশন */}
      <div className="w-full text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-4 tracking-tight max-w-3xl mx-auto leading-tight">
          Why Choose Saffron Edge for Your Semantic <br /> SEO Services?
        </h2>
        <p className="text-gray-500 text-sm md:text-base max-w-4xl mx-auto leading-relaxed font-normal">
          What doesn't get you anywhere is writing for your business only. We help your site speak the language of search engines, and the language of your users.
        </p>
      </div>

      {/* ২. ৬টি বিশেষ টু-টোন কার্ডের ৩-কলাম গ্রিড লেআউট */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {featuresData.map((card, idx) => (
          <div 
            key={idx} 
            className="w-full border border-gray-100 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full min-h-[380px]"
          >
            {/* কার্ডের উপরের কালারফুল পার্ট */}
            <div className={`p-6 ${card.topBg} flex-1 flex flex-col items-start gap-3.5`}>
              {/* গোলাকার আইকন বক্স */}
              <div className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                {card.icon}
              </div>

              {/* হোয়াইট রাউন্ডেড ছোট ব্যাজ */}
              <span className="bg-white/80 backdrop-blur-xs text-gray-400 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide border border-white/40">
                {card.badge}
              </span>

              {/* বোল্ড টাইটেল */}
              <h3 className="text-gray-950 font-extrabold text-lg tracking-tight mt-1">
                {card.title}
              </h3>
            </div>

            {/* কার্ডের নিচের পিউর হোয়াইট বিবরণ পার্ট */}
            <div className="p-6 bg-white border-t border-gray-100/30 flex-1 flex items-start">
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed font-normal">
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ৩. নিচের গ্লোবাল ফ্রি এসইও অডিট ব্লক (Bottom Audit Box) */}
      <div className="w-full bg-[#FFF5EF] border border-orange-200/60 rounded-xl p-8 md:p-12 text-center flex flex-col items-center shadow-2xs max-w-7xl mx-auto px-6">
        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight max-w-3xl leading-snug">
          Generic SEO might get you clicks, Semantic SEO brings conversions.
        </h3>
        <p className="text-gray-500 text-sm md:text-base max-w-4xl leading-relaxed mb-8 font-normal">
          Let Saffron Edge help you turn technical architecture and structured content into a long-term authority moat that wins in search and AI-powered results.
        </p>
        <Link 
          href="/free-audit"
          className="bg-[#E05305] text-white font-extrabold px-8 py-3.5 rounded-lg shadow-md hover:bg-[#c84a04] transition-all text-sm md:text-base"
        >
          Get Free SEO Audit
        </Link>
      </div>

    </section>
  );
};

export default WhyChooseUsGrid;