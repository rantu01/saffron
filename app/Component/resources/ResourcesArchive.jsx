"use client";

import React, { useEffect, useState } from 'react';
import { LayoutGrid, BookOpen, FileCode, Calculator, Briefcase, Bookmark } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const ResourcesArchive = () => {
  const searchParams = useSearchParams();

  // বর্তমানে কোন ফিল্টার ট্যাবটি একটিভ আছে তা ট্র্যাক করার জন্য state
  const [activeTab, setActiveTab] = useState('all');

  // টপ ফিল্টার ট্যাবের মেনু লিস্ট (আইকন ও নামসহ)
  const filterTabs = [
    { id: 'all', label: 'All', icon: <LayoutGrid size={20} /> },
    { id: 'ebook', label: 'Ebook', icon: <BookOpen size={20} /> },
    { id: 'templates', label: 'Templates', icon: <FileCode size={20} /> },
    { id: 'calculators', label: 'Calculators', icon: <Calculator size={20} /> },
    { id: 'toolkits', label: 'Toolkits', icon: <Briefcase size={20} /> },
    { id: 'glossary', label: 'Glossary', icon: <Bookmark size={20} /> },
  ];

  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    const hasMatchingTab = filterTabs.some((tab) => tab.id === tabFromQuery);
    setActiveTab(hasMatchingTab ? tabFromQuery : 'all');
  }, [searchParams]);

  // ছবিতে থাকা ৯টি রিসোর্স কার্ডের নিখুঁত ডেটা অবজেক্ট অ্যারে
  const allResources = [
    {
      id: 1,
      category: 'calculators',
      tag: 'Calculators',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=500&auto=format&fit=crop', 
      title: 'ABM ROI Calculator',
      desc: ''
    },
    {
      id: 2,
      category: 'templates',
      tag: 'Templates',
      image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=500&auto=format&fit=crop', 
      title: 'Cluster SEO template',
      desc: 'Plan your website content around the topics that matter most to your business. This simple template...'
    },
    {
      id: 3,
      category: 'ebook',
      tag: 'Ebook',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=500&auto=format&fit=crop', 
      title: 'Rank in AI Overviews Healthcare',
      desc: 'A strategic guide for healthcare marketing leaders to optimize content for AI-driven search overviews...'
    },
    {
      id: 4,
      category: 'templates',
      tag: 'Templates',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=500&auto=format&fit=crop', 
      title: 'Keyword Research',
      desc: 'Know how impactful content works through this keyword research template that balances your...'
    },
    {
      id: 5,
      category: 'glossary',
      tag: 'Glossary',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=500&auto=format&fit=crop', 
      title: 'What is Account-Based...',
      desc: 'Understand ABM strategies to target high-value accounts with personalized campaigns, driving...'
    },
    {
      id: 6,
      category: 'glossary',
      tag: 'Glossary',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=500&auto=format&fit=crop', 
      title: 'what is saas marketing',
      desc: 'Learn how SaaS marketing helps acquire, retain, and grow customers through strategic digital...'
    },
    {
      id: 7,
      category: 'glossary',
      tag: 'Glossary',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=500&auto=format&fit=crop', 
      title: 'SaaS Email Marketing Playbook',
      desc: 'Master SaaS email marketing with proven strategies to boost engagement, nurture leads, and increase...'
    },
    {
      id: 8,
      category: 'templates',
      tag: 'Templates',
      image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=500&auto=format&fit=crop', 
      title: '5 Click Content Engine',
      desc: 'A simple, repeatable framework with prompts, ideas, and formats to help your team generate...'
    },
    {
      id: 9,
      category: 'toolkits',
      tag: 'ToolKits',
      image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=500&auto=format&fit=crop', 
      title: 'ABM Toolkit',
      desc: 'Acquire exponential profits with a strategic approach to gauging high-value users to drive...'
    }
  ];

  // সিলেক্টেড ট্যাব অনুযায়ী ডেটা ফিল্টার করার লজিক
  const filteredResources = activeTab === 'all' 
    ? allResources 
    : allResources.filter(item => item.category === activeTab);

  return (
    <section className="w-full bg-white py-12 px-4 md:px-8 max-w-7xl mx-auto font-sans">
      
      {/* ১. টপ ক্যাটাগরি ফিল্টার বার (আইকন গ্রিড নেভিগেশন) */}
      <div className="w-full border-b border-gray-200 mb-10 overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-start md:justify-between gap-6 md:gap-12 min-w-max px-4 pb-0">
          {filterTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-2 pb-3 pt-1 border-b-2 font-semibold text-xs md:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isSelected 
                    ? 'border-[#2996E6] text-[#2996E6]' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={isSelected ? 'text-[#2996E6]' : 'text-gray-300 group-hover:text-gray-500'}>
                  {tab.icon}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ২. ৩-কলামের কার্ড গ্রিড লেআউট */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredResources.map((item) => (
          <div 
            key={item.id} 
            className="w-full border border-gray-200/70 rounded-2xl p-4 bg-white shadow-xs flex flex-col h-full min-h-[440px] group cursor-pointer hover:shadow-md transition-all duration-300"
          >
            {/* কার্ড ইমেজ থিম উইথ লাইট ব্লু শেড (ছবির মতো ব্যাকগ্রাউন্ড ভিউ) */}
            <div className="w-full h-48 rounded-xl overflow-hidden mb-5 bg-[#E4F3FF]/40 p-2 border border-blue-50/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            {/* লাইট ব্লু ক্যাটাগরি ট্যাগ ব্যাজ */}
            <div className="mb-3">
              <span className="bg-[#E4F3FF] text-[#2996E6] text-[10px] md:text-xs font-bold px-2.5 py-1.5 rounded-md tracking-wide">
                {item.tag}
              </span>
            </div>

            {/* টাইটেল এবং শর্ট ডেসক্রিপশন */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-gray-950 font-extrabold text-base md:text-[17px] leading-snug tracking-tight mb-2 group-hover:text-[#E05305] transition-colors">
                  {item.title}
                </h3>
                {item.desc && (
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-normal">
                    {item.desc}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ৩. বটম "Load More" ৩ডি পুশ বাটন */}
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

export default ResourcesArchive;