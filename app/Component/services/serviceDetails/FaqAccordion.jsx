"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FaqAccordion = () => {
  // বর্তমানে কোন এফএকিউ (FAQ) আইটেমটি ওপেন আছে তা ট্র্যাক করার জন্য state (Default: 0 অর্থাৎ প্রথমটি ওপেন)
  const [openIndex, setOpenIndex] = useState(0);

  // ছবিতে থাকা সকল প্রশ্ন ও উত্তরের নিখুঁত ডেটা অবজেক্ট অ্যারে
  const faqData = [
    {
      question: "What is Semantic SEO?",
      answer: "Semantic SEO focuses on optimizing content for meaning, relationships, and context so search engines better understand what your page is truly about."
    },
    {
      question: "How is Semantic SEO different from traditional SEO?",
      answer: "Traditional SEO often centers primarily on individual keyword frequencies and exact matches. Semantic SEO goes deeper by structuring content into comprehensive topical clusters, entities, and intent-mapped answers that satisfy modern search engine algorithms and LLMs."
    },
    {
      question: "Who needs Semantic SEO?",
      answer: "Any business looking to establish long-term topical authority, increase qualified conversions, and future-proof their search engine presence against evolving AI search layouts needs Semantic SEO."
    },
    {
      question: "How long does it take to see results?",
      answer: "While traditional keyword ranking timelines can fluctuate, initial improvements in context crawling and topical footprint expansions usually begin within 3 to 6 months depending on existing site architecture and content speed."
    },
    {
      question: "Do you optimize for AI search engines too?",
      answer: "Yes, our strategy heavily incorporates entity structuring, structured schemas, and NLP alignment, ensuring your brand ranks across both classic search interfaces and generative AI engines."
    },
    {
      question: "Will I need to rewrite all my content?",
      answer: "Not necessarily. We audit your existing pages first to spot high-potential assets. Often, structural enhancements, semantic optimization loops, and internal linkage updates are enough to elevate existing content."
    }
  ];

  // অ্যাকোর্ডিয়ন ওপেন/ক্লোজ টগল করার হ্যান্ডলার
  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-white py-16 px-4 md:px-8 max-w-7xl mx-auto font-sans">
      
      {/* ১. সেকশনের মেইন হেডিং টাইটেল */}
      <div className="w-full text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>

      {/* ২. এফএকিউ অ্যাকোর্ডিয়ন কন্টেইনার লিস্ট */}
      <div className="w-full space-y-3.5">
        {faqData.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className={`w-full rounded-xl transition-all duration-300 overflow-hidden ${
                isOpen 
                  ? 'bg-[#EBF5FF] shadow-xs' // একটিভ এফএকিউ এর জন্য ছবিতে থাকা লাইট ব্লু ব্যাকগ্রাউন্ড
                  : 'bg-[#FAF9FC] hover:bg-gray-100/70' // ইন-একটিভ এফএকিউ এর ব্যাকগ্রাউন্ড টোন
              }`}
            >
              
              {/* ক্লিকেবল কোশ্চেন হেডার বার */}
              <button
                onClick={() => handleToggle(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer group"
              >
                <span className="text-gray-950 font-extrabold text-base md:text-lg tracking-tight pr-4">
                  {faq.question}
                </span>
                
                {/* ডানদিকের আপ/ডাউন অ্যারো আইকন */}
                <div className="text-gray-500 flex-shrink-0 transition-transform duration-200">
                  {isOpen ? <ChevronUp size={18} className="text-gray-800" /> : <ChevronDown size={18} />}
                </div>
              </button>

              {/* অ্যাকোর্ডিয়ন কলাপসিবল অ্যানিমেটেড অ্যান্সার বক্স */}
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 pt-0 border-t border-blue-100/40">
                  <p className="text-gray-600 text-sm leading-relaxed font-normal pt-4">
                    {faq.answer}
                  </p>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
};

export default FaqAccordion;