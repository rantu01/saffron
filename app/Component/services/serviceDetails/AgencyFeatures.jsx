import React from 'react';
import { BarChart3, Binary, Layers, FileJson } from 'lucide-react';

const AgencyFeatures = () => {
  // ডানদিকের ৪টি ফিচার কার্ডের ডেটা অবজেক্ট অ্যারে
  const features = [
    {
      icon: <BarChart3 size={24} className="text-[#E05305]" />,
      title: "Entity-Driven Topic Architecture",
      desc: "We design your site's content around key entities and relationships—making it easier for Google to categorize and rank."
    },
    {
      icon: <Binary size={24} className="text-[#E05305]" />,
      title: "NLP-Enhanced Structuring",
      desc: "We use natural language models to align your copy with how humans phrase queries and how search engines interpret them."
    },
    {
      icon: <Layers size={24} className="text-[#E05305]" />,
      title: "Cluster-First Content Design",
      desc: "We create pillar and cluster pages built for topic authority and semantic relevance, helping you dominate intent groups, not just single terms."
    },
    {
      icon: <FileJson size={24} className="text-[#E05305]" />,
      title: "Structured Data & Schema Strategy",
      desc: "We embed meaningful schema to help engines extract context, define topics, and understand your page's purpose faster."
    }
  ];

  return (
    <div className="bg-[#f3ebfb]">
      <section className="w-full bg-white py-16 px-4 md:px-6 lg:px-6 font-sans  rounded-t-[120px]">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start w-full">

            {/* বাম দিকের কলাম: মেইন হেডিং ও বিবরণ (৫ স্প্যান) */}
            <div className="lg:col-span-5 flex flex-col items-start text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 leading-[1.2] tracking-tight mb-6">
                What Makes a Great <br />
                Semantic SEO Agency?
              </h2>

              <p className="text-gray-500 text-sm md:text-base leading-relaxed font-normal mb-8 max-w-md">
                Semantic SEO isn't about keyword stuffing, it's about meaning, structure, and context.
                At Saffron Edge, we connect your content to the way people speak, search, and expect answers.
              </p>

              {/* ছবির মতো বাম পাশে অরেঞ্জ বর্ডার দেওয়া হাইলাইটেড ব্লক */}
              <div className="border-l-2 border-[#E05305] bg-[#FFF5EF] p-5 rounded-r-xl max-w-md">
                <p className="text-gray-600 text-sm md:text-[15px] leading-relaxed font-medium">
                  Traditional SEO ranks pages. Semantic SEO ranks ideas, relationships, and context.
                  It builds the purpose of your content.
                </p>
              </div>
            </div>

            {/* ডান দিকের কলাম: ৪টি কার্ডের রেসপন্সিভ ২-কলাম গ্রিড (৭ স্প্যান) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              {features.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-100/70 rounded-2xl p-6 md:p-8 shadow-md shadow-gray-200/30 flex flex-col items-start min-h-[260px] hover:shadow-lg transition-shadow duration-300"
                >
                  {/* আইকন কন্টেইনার */}
                  <div className="p-2.5 bg-orange-50/50 rounded-xl mb-5 shadow-xs border border-orange-100/10">
                    {item.icon}
                  </div>

                  {/* কার্ড টাইটেল */}
                  <h3 className="text-gray-950 font-extrabold text-base md:text-[17px] tracking-tight leading-snug mb-3">
                    {item.title}
                  </h3>

                  {/* কার্ড ডেসক্রিপশন */}
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>

      </section>
    </div>

  );
};

export default AgencyFeatures;