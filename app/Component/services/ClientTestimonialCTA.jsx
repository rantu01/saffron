"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const ClientTestimonialCTA = () => {
  const testimonials = [
    {
      id: 't1',
      text: "Saffron's SEO services 2X'd our monthly sales from $100K to $200K — the team's strategy and execution were spot on.",
      name: 'John Stewart',
      role: 'Stone Machinery and Equipment Ecommerce',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    },
    {
      id: 't2',
      text: "Their content and outreach approach boosted our lead quality dramatically. We saw conversion rates climb within weeks.",
      name: 'Maya Patel',
      role: 'Head of Growth, Helix Health',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    },
    {
      id: 't3',
      text: "Working with Saffron felt like an extension of our team — pragmatic, data-driven, and relentlessly focused on ROI.",
      name: 'Carlos Rivera',
      role: 'VP Marketing, NovaTech',
      image: 'https://images.unsplash.com/photo-1545996124-1b7a30d5f0d6?q=80&w=150&auto=format&fit=crop',
    },
    {
      id: 't4',
      text: "Their ABM toolkit and playbooks helped us close bigger deals faster — highly recommended for B2B teams.",
      name: 'Aisha Khan',
      role: 'Growth Lead, Scale Labs',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=150&auto=format&fit=crop',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // auto-advance every 2 seconds
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % testimonials.length);
    }, 2000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [testimonials.length]);

  const pause = () => clearInterval(timerRef.current);
  const resume = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % testimonials.length);
    }, 2000);
  };

  return (
    <section className="w-full bg-white py-16 px-6 md:px-12 lg:px-24 font-sans relative overflow-hidden max-w-7xl mx-auto">
      
      {/* ডানদিকের ব্যাকগ্রাউন্ডে থাকা হালকা ওয়াটারমার্ক টেক্সচার (Inline SVG) */}
      <div className="absolute right-0 top-12 opacity-[0.04] pointer-events-none hidden lg:block select-none">
        <svg width="300" height="300" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 180 V100 H70 V120 H120 V60 H170 V20 H200 V180 Z" stroke="#E05305" strokeWidth="6" />
        </svg>
      </div>

      <div className="w-full flex flex-col items-start relative z-10">
        
        {/* ১. টপ হেডার সেকশন */}
        <div className="w-full text-center mb-12">
          <span className="text-[#2996E6] font-extrabold text-xs tracking-widest uppercase block mb-2">
            Testimonials
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold text-gray-950 tracking-tight">
            What our customers say about us
          </h2>
        </div>

        {/* ২. কোটেশনসহ মূল রিভিও ব্লক (Auto-sliding carousel) */}
        <div
          className="w-full max-w-5xl mx-auto relative mb-10"
          onMouseEnter={pause}
          onMouseLeave={resume}
        >
          <span className="absolute left-0 top-0 text-4xl md:text-5xl font-serif font-black text-gray-950 leading-none select-none">
            “
          </span>

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)`, width: `${testimonials.length * 100}%` }}
              aria-live="polite"
            >
              {testimonials.map((t) => (
                <div key={t.id} className="w-full flex-shrink-0 px-8 py-6 flex gap-6 items-start">
                  <div className="flex flex-col gap-6">
                    <p className="text-gray-500 text-base md:text-lg lg:text-xl italic font-normal leading-relaxed tracking-normal">
                      {t.text}
                    </p>

                    <div className="flex items-center gap-3.5">
                      <img
                        src={t.image}
                        alt={t.name}
                        className="w-11 h-11 rounded-full object-cover shadow-2xs border border-gray-100"
                      />
                      <div className="leading-tight">
                        <h4 className="text-gray-950 font-extrabold text-sm md:text-base tracking-tight">
                          {t.name}
                        </h4>
                        <p className="text-[#E05305] text-xs font-semibold mt-0.5">
                          {t.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ৩. নিচের কার্ভড লাইট-ব্লু কল-টু-অ্যাকশন (CTA) উইজেট */}
        <div className="w-full max-w-5xl mx-auto bg-[#E3F2FD] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 relative border border-blue-100/30 shadow-2xs overflow-hidden mt-6">
          {/* বামের টেক্সট এরিয়া */}
          <div className="text-left max-w-xl">
            <h3 className="text-lg md:text-xl font-extrabold text-gray-950 mb-3 tracking-tight">
              Ready to take your growth to the next level?
            </h3>
            <p className="text-gray-500 text-xs md:text-sm font-medium leading-relaxed">
              We help you accelerate your marketing momentum with our <br className="hidden md:block" />
              in-house growth marketing experts!
            </p>
          </div>

          {/* ডানের সেটআপ কল বাটন */}
          <div className="flex-shrink-0 z-10 w-full md:w-auto">
            <Link
              href="/strategy-call"
              className="w-full md:w-auto inline-block bg-white text-[#E05305] border border-orange-100/30 shadow-sm font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-sm hover:bg-orange-50/50 transition-colors text-center whitespace-nowrap"
            >
              Set Up A 1:1 Strategy Call
            </Link>
          </div>

          {/* উইজেটের ব্যাকগ্রাউন্ড ওয়াটারমার্ক লাইন আর্ট (SVG) */}
          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none hidden md:block">
            <svg width="150" height="90" viewBox="0 0 150 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 90 V70 H40 V50 H70 V30 H100 V10 H130 V90" stroke="#2996E6" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ClientTestimonialCTA;