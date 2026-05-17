"use client";

import React, { useState } from 'react';
import Link from 'next/link';

const DigitalExperiencesHero = () => {
  // কোন কেস স্টাডি স্লাইডটি এক্টিভ আছে তা ট্র্যাক করার জন্য স্টেট
  const [currentSlide, setCurrentSlide] = useState(0);

  // স্লাইডারের ভেতরের ডাইনামিক ডেটা
  const slidesData = [
    {
      id: 0,
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop", // ছবির মত মডেল/বিউটি রিলেটেড ফেস ইমেজ
      tag: "D2C / DTC",
      title: "Nude Envie: 100% Revenue Growth in 8 Months for this Beauty Business"
    },
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=600&auto=format&fit=crop", // টেকনিক্যাল/বিজনেস মকআপ
      tag: "B2B SaaS",
      title: "Automating Pipeline Conversion: 3.5x Scale in Qualified Enterprise Funnels"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop", // মার্কেটিং অ্যানালিটিক্স
      tag: "E-commerce",
      title: "Optimizing Ad Spend Retention to Recover 45% Cart Abandonment Leakage"
    }
  ];

  return (
    <section className="w-full bg-[#E3F2FD] py-16 px-6 md:px-12 lg:px-24 flex items-center min-h-[80vh] font-sans">
      <div className="max-w-7xl px-4 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        
        {/* বাম দিকের কলাম: টেক্সট কনটেন্ট (৭ স্প্যান) */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          
          {/* ছোট কেস স্টাডিজ ব্যাজ */}
          <div className="border border-gray-400/40 rounded-md px-3 py-1 bg-white/40 text-xs font-semibold text-gray-700 tracking-wide mb-6">
            Case Studies
          </div>

          {/* মেইন হেডিং (beyond শব্দটিকে আলাদাভাবে হাইলাইট করা হয়েছে) */}
          <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold text-gray-950 leading-[1.15] tracking-tight mb-6">
            We take digital <br />
            experiences <br />
            <span className="text-[#E05305]">beyond</span> your thinking
          </h1>

          {/* সাবটেক্সট বা বর্ণনা */}
          <p className="text-gray-600 text-sm md:text-base max-w-xl leading-relaxed font-normal mb-8">
            Trusted by 2,500+ clients worldwide, we bring 18+ years of experience to deliver a consistently high 99% satisfaction rate.
          </p>

          {/* কল-টু-অ্যাকশন বাটন রো */}
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            {/* Contact Us Button */}
            <Link 
              href="/contact"
              className="bg-[#E05305] text-white font-bold text-sm md:text-base px-8 py-3.5 rounded-lg shadow-md hover:bg-[#c84a04] transition-all text-center min-w-[150px]"
            >
              Contact Us
            </Link>

            {/* Our Resources 3D Button */}
            <Link 
              href="/resources"
              className="bg-white text-[#E05305] border border-[#E05305] font-bold text-sm md:text-base px-8 py-3.5 rounded-lg shadow-[0_4px_0_0_#c84a04] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#c84a04] active:translate-y-[4px] active:shadow-none transition-all text-center min-w-[150px]"
            >
              Our Resources
            </Link>
          </div>
        </div>

        {/* ডান দিকের কলাম: ডাইনামিক স্লাইডার কার্ড (৫ স্প্যান) */}
        <div className="lg:col-span-5 w-full flex flex-col items-center">
          <div 
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slidesData.length)}
            className="w-full bg-white rounded-2xl p-4 shadow-xl shadow-blue-900/5 border border-white/60 cursor-pointer group transition-all duration-300 select-none"
          >
            {/* স্লাইডারের ইমেজ এরিয়া */}
            <div className="w-full h-64 md:h-72 rounded-xl overflow-hidden mb-4 relative bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={slidesData[currentSlide].image} 
                alt={slidesData[currentSlide].title} 
                className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500"
              />
            </div>

            {/* স্লাইডার ক্যাটাগরি ট্যাগ */}
            <div className="mb-3">
              <span className="bg-[#E4F3FF] text-[#2996E6] text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-md tracking-wide">
                {slidesData[currentSlide].tag}
              </span>
            </div>

            {/* স্লাইডার বোল্ড টাইটেল */}
            <h3 className="text-gray-950 font-extrabold text-base md:text-lg leading-snug tracking-tight mb-6">
              {slidesData[currentSlide].title}
            </h3>

            {/* নিচের প্রোগ্রেসিভ স্লাইড ইন্ডিকেটর বারসমূহ (Horizontal Indicator Bars) */}
            <div className="grid grid-cols-3 gap-2 w-full pt-2">
              {slidesData.map((slide, index) => (
                <div 
                  key={slide.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-[#E05305]' // একটিভ স্লাইডের নিচে কমলা রঙের সলিড বার
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default DigitalExperiencesHero;