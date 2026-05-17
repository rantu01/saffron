"use client";

import React from 'react';
import Link from 'next/link';

const ResourcesShowcase = () => {
  return (
    <section className="w-full bg-white py-16 px-4 md:px-4 max-w-7xl mx-auto font-sans">
      
      {/* ১. উপরের স্প্লিট সেকশন (টেক্সট এবং সাবস্ক্রিপশন ফর্ম) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16 w-full">
        
        {/* বাম দিকের কলাম: বিবরণ (৭ স্প্যান) */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {/* ছোট রিসোর্সেস ব্যাজ */}
          <div className="border border-gray-300 rounded-md px-3 py-1 bg-white text-xs font-semibold text-gray-500 tracking-wide mb-6">
            Resources
          </div>

          {/* মেইন হেডিং (Free শব্দটিকে আলাদাভাবে হাইলাইট করা হয়েছে) */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-950 leading-[1.15] tracking-tight mb-6">
            Get <span className="text-[#E05305]">Free</span> Business <br />
            Marketing Resources
          </h1>

          {/* সাবটেক্সট বা বর্ণনা */}
          <p className="text-gray-500 text-sm md:text-base max-w-xl leading-relaxed font-normal">
            Get free e-books, guides, templates, toolkits and more directly in your inbox to discover new revenue streams, improve customer experience and scale marketing.
          </p>
        </div>

        {/* ডান দিকের কলাম: সাবস্ক্রিপশন ফর্ম বক্স (৫ স্প্যান) */}
        <div className="lg:col-span-5 w-full">
          <div className="w-full bg-[#FAFAFA] border border-gray-100/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-gray-200/40 max-w-md mx-auto lg:ml-auto">
            <form className="space-y-4">
              
              {/* Email Input */}
              <input 
                type="email" 
                placeholder="Email" 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#E05305] focus:border-[#E05305] text-sm text-gray-900 bg-white placeholder-gray-400"
                required
              />

              {/* Full Name Input */}
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#E05305] focus:border-[#E05305] text-sm text-gray-900 bg-white placeholder-gray-400"
                required
              />

              {/* ডামি reCAPTCHA বক্স */}
              <div className="w-full p-3 bg-white border border-gray-200 rounded-md flex items-center justify-between shadow-2xs">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    required 
                  />
                  <span className="text-sm font-medium text-gray-600">I'm not a robot</span>
                </label>
                <div className="flex flex-col items-center justify-center text-[9px] text-gray-400 leading-none gap-0.5 select-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/ad/RecaptchaLogo.svg" 
                    alt="reCAPTCHA" 
                    className="w-5 h-5 object-contain" 
                  />
                  <span>reCAPTCHA</span>
                </div>
              </div>

              {/* Subscribe Button */}
              <button 
                type="submit" 
                className="w-full bg-[#E05305] text-white font-extrabold py-3 rounded-lg shadow-md hover:bg-[#c84a04] transition-all text-center tracking-wide text-sm"
              >
                Subscribe
              </button>

            </form>
          </div>
        </div>

      </div>

      {/* ২. নিচের বড় আলটিমেট মার্কেটিং টুলকিট অফার ব্যানার */}
      <div className="w-full bg-[#FFF5EF] border border-orange-200/60 rounded-xl p-8 md:p-10 text-center flex flex-col items-center shadow-2xs">
        {/* ব্যানার হেডিং */}
        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Get our Ultimate Marketing Toolkit for Free
        </h3>
        
        {/* ব্যানার সাবটেক্সট */}
        <p className="text-gray-500 text-sm md:text-base max-w-2xl leading-relaxed mb-6 font-normal">
          This includes 100+ tools related to SEO, automation, social media, Ads, and more.
        </p>
        
        {/* Get Free Access Button */}
        <Link 
          href="/toolkit-access"
          className="bg-[#E05305] text-white font-bold px-8 py-3.5 rounded-lg shadow-md hover:bg-[#c84a04] transition-all text-sm md:text-base tracking-wide"
        >
          Get Free Access
        </Link>
      </div>

    </section>
  );
};

export default ResourcesShowcase;