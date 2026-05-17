"use client";

import React, { useState } from 'react';

const TechStackGrid = () => {
  // বর্তমানে কোন ক্যাটাগরি ট্যাবটি একটিভ আছে তা ট্র্যাক করার জন্য state (Default: marketing)
  const [activeTab, setActiveTab] = useState('marketing');

  // ফিল্টার ট্যাবের মেনু লিস্ট
  const categories = [
    { id: 'marketing', label: 'Marketing' },
    { id: 'design', label: 'Design' },
    { id: 'development', label: 'Development' },
    { id: 'analytics', label: 'Data Analytics' },
    { id: 'automation', label: 'Marketing Automation' },
  ];

  // ছবিতে থাকা এবং অন্যান্য সম্ভাব্য টেক স্ট্যাক লোগোর ডাইনামিক ডেটা অবজেক্ট অ্যারে
  const allStacks = [
    // Marketing Stack
    { id: 1, category: 'marketing', name: 'Ahrefs', logo: 'https://cdn.worldvectorlogo.com/logos/ahrefs.svg' },
    { id: 2, category: 'marketing', name: 'Semrush', logo: 'https://cdn.worldvectorlogo.com/logos/semrush-1.svg' },
    { id: 3, category: 'marketing', name: 'Keyword Insights', logo: 'https://via.placeholder.com/30/1e1b4b/ffffff?text=K' }, // ডামি আইকন
    { id: 4, category: 'marketing', name: 'Google My Business', logo: 'https://cdn.worldvectorlogo.com/logos/google-my-business.svg' },
    { id: 5, category: 'marketing', name: 'Google Ads', logo: 'https://cdn.worldvectorlogo.com/logos/google-ads-3.svg' },
    { id: 6, category: 'marketing', name: 'Meta', logo: 'https://cdn.worldvectorlogo.com/logos/meta-1.svg' },
    { id: 7, category: 'marketing', name: 'LinkedIn Ads', logo: 'https://cdn.worldvectorlogo.com/logos/linkedin-icon-2.svg' },

    // Design Stack (ডামি ডেটা স্যুইচিং টেস্ট করার জন্য)
    { id: 8, category: 'design', name: 'Figma', logo: 'https://cdn.worldvectorlogo.com/logos/figma-1.svg' },
    { id: 9, category: 'design', name: 'Adobe XD', logo: 'https://cdn.worldvectorlogo.com/logos/adobe-xd-2.svg' },
    { id: 10, category: 'design', name: 'Photoshop', logo: 'https://cdn.worldvectorlogo.com/logos/adobe-photoshop-2.svg' },

    // Development Stack
    { id: 11, category: 'development', name: 'Next.js', logo: 'https://cdn.worldvectorlogo.com/logos/next-js.svg' },
    { id: 12, category: 'development', name: 'React', logo: 'https://cdn.worldvectorlogo.com/logos/react-2.svg' },
    { id: 13, category: 'development', name: 'Tailwind CSS', logo: 'https://cdn.worldvectorlogo.com/logos/tailwindcss-3.svg' },

    // Data Analytics Stack
    { id: 14, category: 'analytics', name: 'Google Analytics', logo: 'https://cdn.worldvectorlogo.com/logos/google-analytics-4.svg' },
    { id: 15, category: 'analytics', name: 'Hotjar', logo: 'https://cdn.worldvectorlogo.com/logos/hotjar.svg' },

    // Marketing Automation Stack
    { id: 16, category: 'automation', name: 'HubSpot', logo: 'https://cdn.worldvectorlogo.com/logos/hubspot.svg' },
    { id: 17, category: 'automation', name: 'Zapier', logo: 'https://cdn.worldvectorlogo.com/logos/zapier-2.svg' },
  ];

  // সিলেক্টেড ট্যাব অনুযায়ী ডেটা ফিল্টার করার লজিক
  const filteredStacks = allStacks.filter(item => item.category === activeTab);

  return (
    <section className="w-full bg-white py-16 px-4 text-center font-sans max-w-5xl mx-auto">
      
      {/* ১. মেইন হেডিং টাইটেল */}
      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-8 tracking-tight">
        Our Tech Stack = Your Growth Stack
      </h2>

      {/* ২. হরিজন্টাল ফিল্টার বাটন রো */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12 max-w-4xl mx-auto">
        {categories.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg border font-bold text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                isSelected 
                  ? 'bg-[#E05305] border-[#E05305] text-white shadow-xs' 
                  : 'bg-white border-gray-400 text-gray-500 hover:text-gray-800 hover:border-gray-500'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ৩. নিচে লোগো পিলস (Logo Pills) ডিসপ্লে এরিয়া */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center gap-4 transition-all duration-300">
        
        {/* লোগোগুলোকে ছবির মতো ফ্লেক্স-র‍্যাপ এবং সেন্ট্রাল এলাইনমেন্টে দেখানোর জন্য কন্টেইনার */}
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl">
          {filteredStacks.map((item) => (
            <div 
              key={item.id} 
              className="bg-white border border-gray-200 shadow-2xs rounded-full px-5 py-2 flex items-center gap-2.5 hover:shadow-xs hover:border-gray-300 transition-all duration-200 cursor-pointer"
            >
              {/* লোগো ইমেজ */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={item.logo} 
                alt={`${item.name} logo`} 
                className="w-5 h-5 object-contain flex-shrink-0"
              />
              {/* টেক্সট নেম */}
              <span className="text-gray-800 text-sm font-semibold tracking-tight whitespace-nowrap">
                {item.name}
              </span>
            </div>
          ))}
        </div>

      </div>

    </section>
  );
};

export default TechStackGrid;