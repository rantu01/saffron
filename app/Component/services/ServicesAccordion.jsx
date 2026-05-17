"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import services from './servicesData';

const ServicesAccordion = () => {
  // বর্তমানে কোন অ্যাকোর্ডিয়নটি ওপেন আছে তা ট্র্যাক করার জন্য স্টেট (Default: 01 অর্থাৎ প্রথমটি ওপেন)
  const [openIndex, setOpenIndex] = useState(0);

  // services imported from shared data file

  // অ্যাকোর্ডিয়ন ক্লিক হ্যান্ডলার
  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-white py-16 px-4 md:px-4 max-w-7xl mx-auto font-sans">
      
      {/* ১. টপ হেডার সেকশন */}
      <div className="w-full text-center mb-12">
        <span className="text-blue-500 font-extrabold text-xs tracking-widest uppercase block mb-2">
          Our Services
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-950 tracking-tight">
          Growth-Oriented Marketing Solutions Built to Scale
        </h2>
      </div>

      {/* ২. অ্যাকোর্ডিয়ন লিস্ট এরিয়া */}
      <div className="w-full space-y-0 border-t border-gray-300 mb-12">
        {services.map((service, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={service.num} className="w-full border-b border-gray-300">
              
              {/* অ্যাকোর্ডিয়ন ক্লিকেবল হেডার রো */}
              <button
                onClick={() => handleToggle(index)}
                className="w-full py-5 flex items-center justify-between text-left focus:outline-none group transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* ছোট নাম্বার বক্স (একটিভ হলে অরেঞ্জ ব্যাকগ্রাউন্ড, অন্যথায় লাইট গ্রে) */}
                  <span className={`text-xs font-bold w-7 h-6 flex items-center justify-center rounded-sm transition-colors duration-300 ${
                    isOpen ? 'bg-[#E05305] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {service.num}
                  </span>
                  {/* সার্ভিসের নাম */}
                  <h3 className={`text-base md:text-[20px] font-extrabold tracking-tight transition-colors duration-300 ${
                    isOpen ? 'text-[#E05305]' : 'text-gray-950 group-hover:text-[#E05305]'
                  }`}>
                    {service.title}
                  </h3>
                </div>

                {/* ডানদিকের প্লাস / মাইনাস আইকন */}
                <div className="text-gray-950 font-black text-xl md:text-2xl w-6 text-center select-none">
                  {isOpen ? '—' : '+'}
                </div>
              </button>

              {/* অ্যাকোর্ডিয়ন কলাপসিবল ড্রপডাউন কনটেন্ট */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isOpen ? 'max-h-[500px] opacity-100 pb-8 pl-11' : 'max-h-0 opacity-0'
              }`}>
                <div className="max-w-2xl">
                  {/* ডেসক্রিপশন */}
                  <p className="text-gray-500 text-sm leading-relaxed mb-5 font-normal">
                    {service.desc}
                  </p>

                  {/* কি-ফিচার বুলেটেড লিস্ট */}
                  <ul className="space-y-2 mb-6 text-sm text-gray-800 font-semibold pl-4">
                    {service.features.map((feat, i) => (
                      <li key={i} className="list-disc marker:text-gray-400">
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* Learn More Button */}
                  <Link
                    href={`/services/${service.slug}`}
                    className="inline-block bg-[#E05305] text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xs hover:bg-[#c84a04] transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ৩. নিচের কার্ভড লাইট-ব্লু কল-টু-অ্যাকশন (CTA) উইজেট */}
      <div className="w-full bg-[#E3F2FD] rounded-xl p-6 md:p-8 text-center flex flex-col items-center border border-blue-100/40 shadow-2xs">
        <h4 className="text-base md:text-lg font-extrabold text-gray-950 mb-1.5 tracking-tight">
          Accelerate your ROI with result-oriented marketing strategies.
        </h4>
        <p className="text-gray-500 text-xs font-medium max-w-2xl mb-5">
          We drive business growth by optimizing every inbound channel to attract and convert high-quality clients for you
        </p>
        {/* Set up a strategy call Button */}
        <Link
          href="/strategy-call"
          className="bg-white text-[#E05305] border border-orange-100/30 shadow-xs font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-xs hover:bg-orange-50/50 transition-colors"
        >
          Set Up A 1:1 Strategy Call
        </Link>
      </div>

    </section>
  );
};

export default ServicesAccordion;