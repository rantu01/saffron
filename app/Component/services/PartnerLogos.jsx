"use client";

import React, { useState } from 'react';

const PartnerLogos = () => {
  // কোন লোগো সেটটি বর্তমানে এক্টিভ আছে তা ট্র্যাক করার জন্য স্টেট (Default: 0)
  const [activeSlide, setActiveSlide] = useState(0);

  // public/Saffron Logo ফোল্ডারের বাস্তব লোগো ফাইল নেমগুলোর লিস্ট
  const logoFilenames = [
    'imgi_116_lighthouse-logo.webp',
    'imgi_24_radow-logo.webp',
    'imgi_26_express-logo.webp',
    'imgi_27_garden-logo.webp',
    'imgi_29_talent-logo.webp',
    'imgi_30_rlent-logo.webp',
    'imgi_31_frame-1171279456.webp',
    'imgi_32_gck-logo.webp',
    'imgi_33_drbren-logo.webp',
    'imgi_34_spatic-logo.webp',
    'imgi_35_solvecube-logo.webp',
    'imgi_36_empwise-logo.webp',
    'imgi_37_twixor-logo.webp',
    'imgi_39_kanbanize-logo.webp',
    'imgi_40_nude-logo.webp',
    'imgi_41_stm-logo.webp',
    'imgi_42_responsify-logo.webp',
    'imgi_43_resoulte-partner.webp',
    'imgi_44_knowledge-logo.webp',
    'imgi_45_lighthouse-logo.webp',
    'imgi_46_gearsource-logo.webp',
    'imgi_48_etworksdrops-logo.webp',
    'imgi_4_b1hwuyvwud51xaw9fnyu_optimized.webp',
    'imgi_50_shock-logo.webp',
    'imgi_52_martin-logo.webp',
    'imgi_53_swift-logo.webp',
  ];

  const logos = logoFilenames.map((file) => ({
    name: file.replace(/(imgi_\d+_|\.webp|-logo|_optimized|_)/g, ' ').replace(/\s+/g, ' ').trim(),
    url: `/Saffron%20Logo/${file}`,
  }));

  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  };

  const slides = chunkArray(logos, 4).map((group, idx) => ({ id: idx, logos: group }));

  return (
    <section className="w-full bg-[#EBF5FF]/60 py-12 px-6 md:px-12 text-center font-sans">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* ১. সেকশনের উপরের ছোট সাব-টাইটেল */}
        <h4 className="text-gray-800 text-sm md:text-base font-semibold mb-10 tracking-normal">
          Trusted Marketing Partner for Top Brands
        </h4>

        {/* ২. লোগো ডিসপ্লে এরিয়া (অ্যানিমেশন বাটন ট্র্যাকিং সহ) */}
        <div className="w-full overflow-hidden mb-8 min-h-[70px] flex items-center justify-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 items-center justify-center max-w-5xl w-full transition-all duration-500 ease-in-out">
            {slides[activeSlide].logos.map((logo, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity duration-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={logo.url} 
                  alt={`${logo.name} logo`} 
                  className="h-8 md:h-11 object-contain max-w-[160px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ৩. নিচে ড্যাশ ইন্ডিকেটরস বা স্লাইড বাটন (ছবির মতো আউটলাইন ড্যাশ ডিজাইন) */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlide(index)}
              className={`h-2 transition-all duration-300 rounded-xs cursor-pointer border ${
                index === activeSlide 
                  ? 'w-4 bg-[#E05305] border-[#E05305]' // একটিভ বাটনটি সলিড অরেঞ্জ
                  : 'w-4 bg-transparent border-[#E05305] hover:bg-orange-50' // ইন-একটিভ বাটনটি আউটলাইন অরেঞ্জ
              }`}
              aria-label={`Go to slide set ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default PartnerLogos;