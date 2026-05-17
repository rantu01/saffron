"use client";

import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const CaseStudiesArchive = () => {
  // সার্চ ইনপুট এবং ফিল্টার স্টেট (ভবিষ্যতে ফাংশনালিটি যোগ করার জন্য)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // ছবিতে থাকা ৯টি কার্ডের নিখুঁত ডেটা অবজেক্ট অ্যারে
  const allCases = [
    {
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=500&auto=format&fit=crop", 
      tag: "SEO",
      title: "How We Tripled Website Revenue for a Mid-Market Industrial Logistics Provider in 8 Months"
    },
    {
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=500&auto=format&fit=crop", 
      tag: "SEO",
      title: "How Saffron Edge focused on local SEO & AI search to sustain 300+ monthly leads for a U.S...."
    },
    {
      image: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=500&auto=format&fit=crop", 
      tag: "SEO",
      title: "200+ Patient Bookings in 180 Days for Alternate Medicine Brand"
    },
    {
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=500&auto=format&fit=crop", 
      tag: "SEO",
      title: "6.6x Organic Lead Growth with 47% Ranking Growth by Fixing SEO, Content, and Website..."
    },
    {
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=500&auto=format&fit=crop", 
      tag: "SEO",
      title: "Managed Network and Cabling IT Services: See a 4.27x ML growth with GEO Solutions"
    },
    {
      image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=500&auto=format&fit=crop", 
      tag: "Web Development",
      title: "How a Web Hosting Leader Strengthened Its Market Presence with Targeted SEO"
    },
    {
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=500&auto=format&fit=crop", 
      tag: "SEO",
      title: "How Strategic SEO and Redesign Drove a 54% Spike in Traffic for a Packaging Leader"
    },
    {
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=500&auto=format&fit=crop", 
      tag: "SEO",
      title: "Google Ranking Secured by Motor Cars Ltd. Through Revenue-Driven SEO & Content"
    },
    {
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=500&auto=format&fit=crop", 
      tag: "Web Development",
      title: "How \"Making the Grade Project\" Increased Conversions by 65% Through Website Redesign"
    }
  ];

  return (
    <section className="w-full bg-white py-12 px-4 md:px-8 max-w-7xl mx-auto font-sans">
      
      {/* ১. টপ ফিল্টার বার (সার্চ ইনপুট এবং ক্যাটাগরি ড্রপডাউন) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-10 w-full">
        {/* সার্চ ইনপুট ফিল্ড */}
        <div className="relative w-full sm:max-w-2xl flex items-center">
          <input
            type="text"
            placeholder="Find a Case Study"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#E05305] text-gray-800 placeholder-gray-400"
          />
          <Search size={16} className="absolute right-4 text-orange-500 cursor-pointer" />
        </div>

        {/* ক্যাটাগরি ড্রপডাউন বাটন */}
        <div className="relative w-full sm:w-48">
          <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-400 font-medium bg-white hover:border-gray-300 transition-colors">
            <span>Category</span>
            <ChevronDown size={16} className="text-orange-400" />
          </button>
        </div>
      </div>

      {/* ২. কেস স্টাডিজ ৩-কলামের কার্ড গ্রিড লেআউট */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {allCases.map((item, idx) => (
          <div 
            key={idx} 
            className="w-full border border-gray-200/70 rounded-2xl p-4 bg-white shadow-xs flex flex-col h-full min-h-[420px] group cursor-pointer hover:shadow-md transition-all duration-300"
          >
            {/* কার্ড ইমেজ থিম উইথ লোগো ওয়াটারমার্ক */}
            <div className="w-full h-48 md:h-52 rounded-xl overflow-hidden mb-5 relative bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
              {/* টপ-রাইট ব্র্যান্ড লোগো ওয়াটারমার্ক (ছবির মতো) */}
              <div className="absolute top-3 right-3 text-[10px] font-black tracking-tight text-white bg-black/10 backdrop-blur-xs px-1.5 py-0.5 rounded-xs opacity-70">
                saffron<span className="text-sky-400">edge</span>
              </div>
            </div>

            {/* লাইট ব্লু ক্যাটাগরি ট্যাগ ব্যাজ */}
            <div className="mb-3.5">
              <span className="bg-[#E4F3FF] text-[#2996E6] text-[10px] md:text-xs font-bold px-2.5 py-1.5 rounded-md tracking-wide">
                {item.tag}
              </span>
            </div>

            {/* কেস স্টাডি হেডিং টাইটেল */}
            <h3 className="text-gray-950 font-extrabold text-sm md:text-base leading-snug tracking-tight group-hover:text-[#E05305] transition-colors duration-200">
              {item.title}
            </h3>
          </div>
        ))}
      </div>

      {/* ৩. বটম "Load More" বাটন */}
      <div className="w-full flex justify-center">
        <button 
          className="bg-white text-[#E05305] border border-[#E05305] font-extrabold text-sm md:text-base px-10 py-3 rounded-lg shadow-[0_4px_0_0_#c84a04] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#c84a04] active:translate-y-[4px] active:shadow-none transition-all text-center min-w-[160px]"
        >
          Load More
        </button>
      </div>

    </section>
  );
};

export default CaseStudiesArchive;