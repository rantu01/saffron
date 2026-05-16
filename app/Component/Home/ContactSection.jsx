"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';

const ContactSection = () => {
  // স্লাইড অ্যানিমেশনের জন্য স্টেট
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // কম্পোনেন্ট মাউন্ট হওয়ার পর অ্যানিমেশন শুরু হবে
    setIsVisible(true);
  }, []);

  return (
    <section className="w-full bg-[#e0f3ff] py-16 px-4 md:px-12 lg:px-24 overflow-hidden font-sans min-h-[90vh] flex items-center">
      
      {/* স্লাইড অ্যানিমেশন কন্টেইনার */}
      <div 
        className={`max-w-7xl px-4 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 ease-out transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
      >
        
        {/* বাম দিকের কলাম: টেক্সট এবং কন্টাক্ট ইনফো */}
        <div className="flex flex-col items-start text-left">
          {/* ছোট অরেঞ্জ ব্যাজ */}
          <span className="bg-[#FFEFE4] text-[#E05305] text-xs font-bold px-4 py-1.5 rounded-md mb-8 tracking-wide">
            Contact Us
          </span>

          {/* মেইন হেডিং */}
          <h2 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-gray-950 leading-[1.1] mb-12 tracking-tight">
            Get Your Custom <br className="hidden md:block" />
            Revenue-driven Growth <br className="hidden md:block" />
            Strategy
          </h2>

          {/* ইমেইল লিংক উইথ আইকন */}
          <a 
            href="mailto:sales@saffronedge.com" 
            className="group flex items-center gap-3 text-lg md:text-xl font-bold text-gray-900 border-b-2 border-gray-900 pb-1 hover:text-[#E05305] hover:border-[#E05305] transition-all duration-300"
          >
            sales@saffronedge.com
            <span className="bg-[#E05305] text-white p-1 rounded-full group-hover:scale-110 transition-transform">
              <ArrowUpRight size={20} />
            </span>
          </a>
        </div>

        {/* ডান দিকের কলাম: সাদা কন্টাক্ট ফর্ম কন্টেইনার */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-blue-900/5 w-full max-w-xl mx-auto lg:ml-auto border border-white">
          <form className="space-y-5">
            
            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Jane Doe" 
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-[#E05305] transition-all bg-gray-50/30 text-gray-900"
                required
              />
            </div>

            {/* Email ID Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Email Id <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                placeholder="janedoe@gmail.com" 
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-[#E05305] transition-all bg-gray-50/30 text-gray-900"
                required
              />
            </div>

            {/* Phone No. Input with Country Flag Placeholder */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Phone No. <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 px-4 py-1 rounded-xl border border-gray-200 bg-gray-50/30">
                <div className="flex items-center gap-1.5 pr-2 border-r border-gray-200 cursor-pointer">
                   {/* ডামি ফ্ল্যাগ আইকন */}
                   <span className="text-lg">🇺🇸</span>
                   <span className="text-gray-400">▼</span>
                </div>
                <input 
                  type="tel" 
                  placeholder="XX XXXX XXXX" 
                  className="w-full py-3.5 focus:outline-none bg-transparent text-gray-900"
                  required
                />
              </div>
            </div>

            {/* Website Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Website <span className="text-red-500">*</span>
              </label>
              <input 
                type="url" 
                placeholder="www.www.com" 
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-[#E05305] transition-all bg-gray-50/30 text-gray-900"
                required
              />
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Message
              </label>
              <textarea 
                rows="3"
                placeholder="I want..." 
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-[#E05305] transition-all bg-gray-50/30 text-gray-900 resize-none"
              ></textarea>
            </div>

            {/* Checkbox */}
            <div className="flex items-start gap-3 py-2">
              <input 
                type="checkbox" 
                id="updates"
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#E05305] focus:ring-[#E05305] cursor-pointer"
                defaultChecked
              />
              <label htmlFor="updates" className="text-sm font-medium text-gray-600 leading-tight cursor-pointer">
                Continue getting valuable updates and content via email.
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full sm:w-auto min-w-[160px] bg-[#E05305] text-white font-extrabold py-3.5 px-10 rounded-xl shadow-lg hover:bg-[#c84a04] hover:scale-[1.02] active:scale-95 transition-all duration-200 text-lg"
            >
              Submit
            </button>

          </form>
        </div>

      </div>
    </section>
  );
};

export default ContactSection;