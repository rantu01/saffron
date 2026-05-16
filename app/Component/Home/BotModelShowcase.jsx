import React from 'react';
import Link from 'next/link';

const BotModelShowcase = () => {
  return (
    <section className="w-full bg-white py-16 px-4 md:px-4 max-w-7xl mx-auto font-sans">
      
      {/* ১. টপ হেডার সেকশন */}
      <div className="w-full text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-4 tracking-tight">
          Pre-trained In-house Marketing Team
        </h2>
        <p className="text-gray-500 text-sm md:text-base max-w-4xl mx-auto leading-relaxed font-normal">
          Our build-operate-transfer (BOT) model enables brands to achieve their revenue goals while minimizing potential risks, such as overspending on the wrong marketing channel or hiring.
        </p>
      </div>

      {/* ২. মিডেল টু-কলাম গ্রিড (ফ্লোচার্ট এবং কনটেন্ট বক্স) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto mb-16">
        
        {/* বাম দিকের কলাম: কাস্টম CSS ফ্লোচার্ট ইলাস্ট্রেশন */}
        <div className="bg-[#FFEFE4] rounded-2xl p-8 flex flex-col justify-center items-center relative min-h-[380px] overflow-hidden border border-orange-100/40">
          {/* ব্যাকগ্রাউন্ড কার্ভ লাইন ইফেক্ট (SVG Path) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 350" fill="none">
            <path d="M40,0 V100 C40,140 160,120 160,160 C160,190 40,180 40,230 C40,270 200,260 200,350" stroke="#D66D26" strokeWidth="1.5" opacity="0.6" />
            {/* ছোট অ্যারো বা তীর চিহ্ন */}
            <polygon points="105,230 95,225 95,235" fill="#D66D26" transform="rotate(0 100 230)" />
          </svg>

          {/* ফ্লোচার্টের ৩টি নোড/বাটন */}
          <div className="relative z-10 w-full flex flex-col gap-10 items-center pl-6">
            {/* Build Node */}
            <div className="w-32 bg-white/90 border border-gray-400/60 text-gray-600 font-bold text-center py-2.5 rounded-xl shadow-xs tracking-wide self-start ml-12">
              Build
            </div>
            
            {/* Operate Node */}
            <div className="w-36 bg-[#E05305] text-white font-bold text-center py-2.5 rounded-xl shadow-md tracking-wide">
              Operate
            </div>
            
            {/* Transfer Node */}
            <div className="w-32 bg-white/90 border border-gray-400/60 text-gray-600 font-bold text-center py-2.5 rounded-xl shadow-xs tracking-wide self-end mr-12">
              Transfer
            </div>
          </div>
        </div>

        {/* ডান দিকের কলাম: লাইট ব্লু ইনফো বক্স */}
        <div className="bg-[#E4F3FF] rounded-2xl p-8 flex flex-col justify-between border border-blue-100/40 min-h-[380px]">
          <div>
            {/* ছোট নীল টপ টেক্সট */}
            <span className="text-blue-500 font-semibold text-xs md:text-sm tracking-wide block mb-3">
              Transfer
            </span>
            
            {/* মেইন বোল্ড টাইটেল */}
            <h3 className="text-gray-950 font-extrabold text-xl md:text-[22px] leading-snug tracking-tight mb-6">
              Seamless marketing transition that empowers client ownership and team integration
            </h3>
            
            {/* ডেসক্রিপশন প্যারাগ্রাফ */}
            <p className="text-gray-600 text-sm md:text-base leading-relaxed font-normal">
              Once operations stabilize, we transfer the control, including knowledge, processes, assets, and personnel. During the post-build and operate phases, we transition your dream team to take over the customized growth flywheels.
            </p>
          </div>
        </div>

      </div>

      {/* ৩. বটম কল-টু-অ্যাকশন ব্লক (Bottom CTA Box) */}
      <div className="w-full bg-[#FFF5EF] border border-orange-200/60 rounded-xl p-8 md:p-10 text-center flex flex-col items-center shadow-2xs max-w-7xl mx-auto px-4">
        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Ready to experience the difference?
        </h3>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl leading-relaxed mb-6 font-normal">
          Join thousands of businesses that have transformed their growth with our proven expertise and innovative strategies.
        </p>
        <Link 
          href="/growth-plan"
          className="bg-[#E05305] text-white font-bold px-8 py-3.5 rounded-lg shadow-md hover:bg-[#c84a04] transition-all text-sm md:text-base"
        >
          Get Your Custom Growth Plan
        </Link>
      </div>

    </section>
  );
};

export default BotModelShowcase;