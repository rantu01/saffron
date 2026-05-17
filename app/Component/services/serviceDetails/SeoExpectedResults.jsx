import React from 'react';

const SeoExpectedResults = () => {
  // প্রতিটি রেজাল্ট মেট্রিক্সের কালার এবং টেক্সট ডেটা অবজেক্ট অ্যারে
  const resultsData = [
    {
      value: "7x",
      label: "Increase in Featured Snippet Visibility",
      textColor: "text-[#E05305]" // ব্র্যান্ড অরেঞ্জ রঙের টোন
    },
    {
      value: "8x",
      label: "Increase in Intent-Matched Keyword Rankings",
      textColor: "text-[#29A0FF]" // উজ্জ্বল লাইট ব্লু টোন
    },
    {
      value: "4X",
      label: "Growth in Topical Authority Across Clusters",
      textColor: "text-[#936DFF]" // পার্পল/বেগুনি রঙের টোন
    },
    {
      value: "3X",
      label: "Boost in Entity-Based Content Visibility",
      textColor: "text-[#5B73FF]" // রয়্যাল ব্লু টোন
    }
  ];

  return (
    <section className="w-full bg-[#f3ebfb] py-16 px-6 text-center font-sans">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* ১. সেকশনের উপরের মেইন হেডিং */}
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-950 mb-12 tracking-tight">
          Results Expected from Our Semantic SEO Services
        </h2>

        {/* ২. ৪-কলামের রেসপন্সিভ গ্রিড লেআউট */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 justify-center items-start">
          {resultsData.map((item, index) => (
            <div key={index} className="flex flex-col items-center justify-center max-w-[240px] mx-auto">
              
              {/* বড় নাম্বার মেট্রিক */}
              <span className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-4 ${item.textColor}`}>
                {item.value}
              </span>
              
              {/* নিচের ডেসক্রিপশন বা লেবেল */}
              <p className="text-gray-700 text-sm md:text-base font-medium leading-relaxed">
                {item.label}
              </p>
              
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default SeoExpectedResults;