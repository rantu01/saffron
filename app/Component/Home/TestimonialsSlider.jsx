"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

// টেস্টমোনিয়াল ডাটা (ইমেজের টেক্সট অনুযায়ী)
const testimonialsData = [
  {
    id: 1,
    tag: "Lead Generation",
    metric: "13% Increase in leads",
    text: "Their marketing strategies led to a 13% increase in leads and a 9.6% boost in sales. We loved working with Saffron Edge; working with them was highly pleasing.",
    name: "Sarah Jenkins",
    role: "Marketing Director",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
  },
  {
    id: 2,
    tag: "Marketing Automation",
    metric: "Faster Penalty recovery",
    text: "Saffron Edge helped us recover from a Google penalty, restoring our performance and boosting revenue within 45 days. We are now back on track, and our revenue is exceeding expectations.",
    name: "James Simmons",
    role: "Ecommerce brand (Name under NDA)",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
  },
  {
    id: 3,
    tag: "Search Engine Optimization",
    metric: "Ranked #1 for core keywords",
    text: "I had a great experience working with them. They were proactive in their approach and responded promptly to all my queries. I would definitely work with them again.",
    name: "Jay Stack",
    role: "Manufacturing company",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
  },
  {
    id: 4,
    tag: "Content Marketing",
    metric: "2x Traffic growth",
    text: "Their content strategy completely revamped our organic reach. The quality of writing and strategic distribution helped us double our traffic in less than 3 months.",
    name: "Emily Watson",
    role: "SaaS Startup Founder",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
  }
];

export default function Testimonials() {
  // বর্তমানে কোন ইনডেক্সটি মাঝখানে (অ্যাক্টিভ) থাকবে তা ট্র্যাক করার জন্য
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-advance every 2 seconds
  useEffect(() => {
    const total = testimonialsData.length;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % total);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const handleDotClick = (index) => {
    setActiveIndex(index);
  };

  // refs and measurement for smooth sliding
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const cardRef = useRef(null);
  const [offsetX, setOffsetX] = useState(0);

  const updateOffset = useCallback(() => {
    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    const track = trackRef.current || wrapper;
    if (!wrapper || !card) return;
    const wrapperW = wrapper.clientWidth;
    const cardW = card.clientWidth;
    const style = window.getComputedStyle(track);
    const gapStr = style.gap || style.columnGap || '0px';
    const gap = parseFloat(gapStr) || 0;

    const totalOffset = wrapperW / 2 - cardW / 2 - activeIndex * (cardW + gap);
    setOffsetX(totalOffset);
  }, [activeIndex]);

  useEffect(() => {
    updateOffset();
    const onResize = () => updateOffset();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateOffset]);

  return (
    <section className="bg-[#e0f3ff]  font-sans overflow-hidden">
      <div className="">
        <div className="bg-white rounded-b-[120px] overflow-hidden">
          <div className="text-center px-6 py-12">
        {/* হেডিং সেকশন */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Testimonials
        </h2>
        <p className="text-gray-600 text-base md:text-lg mb-12 max-w-2xl mx-auto">
          We're trusted by the world's best teams for our end-to-end marketing solutions.
        </p>

        {/* কার্ডের মেইন কন্টেইনার */}
        <div ref={wrapperRef} className="w-full max-w-[1188px] mx-auto overflow-hidden">
          <motion.div
            ref={trackRef}
            animate={{ x: offsetX }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="flex items-start gap-4 md:gap-6 py-4"
          >
            {testimonialsData.map((item, idx) => {
              const isCenter = idx === activeIndex;

              return (
                <motion.div
                  key={item.id}
                  ref={idx === 0 ? cardRef : null}
                  className={`flex-none w-[92%] sm:w-[340px] md:w-[380px] bg-white rounded-xl p-6 text-left border border-gray-100 shadow-sm
                    ${!isCenter ? 'pointer-events-none blur-[0.6px]' : 'shadow-md border-gray-200/60'}`}
                >
                  {/* কার্ডের উপরের ট্যাগ ও মেট্রিক */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-[#E6F2FF] text-[#0066CC] font-medium text-xs px-2.5 py-1 rounded">
                      {item.tag}
                    </span>
                    <span className="text-[#22C55E] font-medium text-xs md:text-sm flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      {item.metric}
                    </span>
                  </div>

                  {/* রিভিউ টেক্সট */}
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-6 min-h-[96px]">
                    {item.text}
                  </p>

                  {/* ইউজার প্রোফাইল */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-10 h-10 rounded-full object-cover grayscale-[30%]"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-gray-500 text-xs">{item.role}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* কাস্টম ডট প্যাজিনেশন */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {testimonialsData.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'bg-[#EF5A24] w-8' // ইমেজের মতো কমলা লম্বা ডট
                  : 'bg-gray-200 w-2.5 hover:bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Explore All বাটন */}
        <div className="mt-10">
          <button className="border-2 border-[#EF5A24] text-[#EF5A24] font-semibold px-6 py-2 rounded-lg hover:bg-[#EF5A24] hover:text-white transition-all duration-300 shadow-[0_4px_0_0_#D94E1F] active:translate-y-[2px] active:shadow-[0_2px_0_0_#D94E1F]">
            Explore All
          </button>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}