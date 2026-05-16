"use client";

import React, { useEffect, useRef, useState } from 'react';

// Use logos from public/Saffron Logo — encoded spaces for URLs
const logos = [
  { name: 'lighthouse', url: '/Saffron%20Logo/imgi_116_lighthouse-logo.webp' },
  { name: 'radow', url: '/Saffron%20Logo/imgi_24_radow-logo.webp' },
  { name: 'express', url: '/Saffron%20Logo/imgi_26_express-logo.webp' },
  { name: 'garden', url: '/Saffron%20Logo/imgi_27_garden-logo.webp' },
  { name: 'talent', url: '/Saffron%20Logo/imgi_29_talent-logo.webp' },
  { name: 'rlent', url: '/Saffron%20Logo/imgi_30_rlent-logo.webp' },
  { name: 'frame', url: '/Saffron%20Logo/imgi_31_frame-1171279456.webp' },
  { name: 'gck', url: '/Saffron%20Logo/imgi_32_gck-logo.webp' },
  { name: 'drbren', url: '/Saffron%20Logo/imgi_33_drbren-logo.webp' },
  { name: 'spatic', url: '/Saffron%20Logo/imgi_34_spatic-logo.webp' },
  { name: 'solvecube', url: '/Saffron%20Logo/imgi_35_solvecube-logo.webp' },
  { name: 'empwise', url: '/Saffron%20Logo/imgi_36_empwise-logo.webp' },
  { name: 'twixor', url: '/Saffron%20Logo/imgi_37_twixor-logo.webp' },
  { name: 'kanbanize', url: '/Saffron%20Logo/imgi_39_kanbanize-logo.webp' },
  { name: 'nude', url: '/Saffron%20Logo/imgi_40_nude-logo.webp' },
  { name: 'stm', url: '/Saffron%20Logo/imgi_41_stm-logo.webp' },
  { name: 'responsify', url: '/Saffron%20Logo/imgi_42_responsify-logo.webp' },
  { name: 'resoulte-partner', url: '/Saffron%20Logo/imgi_43_resoulte-partner.webp' },
  { name: 'knowledge', url: '/Saffron%20Logo/imgi_44_knowledge-logo.webp' },
  { name: 'lighthouse-2', url: '/Saffron%20Logo/imgi_45_lighthouse-logo.webp' },
  { name: 'gearsource', url: '/Saffron%20Logo/imgi_46_gearsource-logo.webp' },
  { name: 'etworksdrops', url: '/Saffron%20Logo/imgi_48_etworksdrops-logo.webp' },
  { name: 'saffron', url: '/Saffron%20Logo/imgi_4_b1hwuyvwud51xaw9fnyu_optimized.webp' },
  { name: 'shock', url: '/Saffron%20Logo/imgi_50_shock-logo.webp' },
  { name: 'martin', url: '/Saffron%20Logo/imgi_52_martin-logo.webp' },
  { name: 'swift', url: '/Saffron%20Logo/imgi_53_swift-logo.webp' },
];

const TrustedBy = () => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);
  const scrollPosRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);

  // doubled logos for seamless loop
  const doubledLogos = [...logos, ...logos];

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    let totalWidth = contentEl.scrollWidth;
    let halfWidth = totalWidth / 2;

    // on resize recalc widths
    const handleResize = () => {
      totalWidth = contentEl.scrollWidth;
      halfWidth = totalWidth / 2;
    };

    window.addEventListener('resize', handleResize);

    const speed = 60; // px per second, adjust as needed

    const step = (time) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (!isPaused && contentEl) {
        scrollPosRef.current += speed * delta;
        if (scrollPosRef.current >= halfWidth) {
          // wrap around
          scrollPosRef.current = scrollPosRef.current - halfWidth;
        }
        contentEl.style.transform = `translateX(-${scrollPosRef.current}px)`;
      }

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      lastTimeRef.current = null;
    };
  }, [isPaused]);

  return (
    <section className="w-full bg-[#f3ebfb] py-8 px-6 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
      {/* বাম পাশের স্থায়ী "Trusted By" টেক্সট */}
      <div className="flex-shrink-0 z-10 bg-[#F3EFFFF] pr-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
          Trusted By
        </h3>
      </div>

      {/* ডান পাশের স্লাইডিং লোগো কন্টেইনার */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden flex items-center Mask-Effect"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* The content is a single flex row containing doubled logos; we animate its transform via JS */}
        <div ref={contentRef} className="flex gap-16 items-center whitespace-nowrap will-change-transform">
          {doubledLogos.map((logo, index) => (
            <div
              key={index}
              className="flex-shrink-0 flex items-center justify-center opacity-100 transition-all duration-300 cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.url}
                alt={`${logo.name} logo`}
                className="h-9 md:h-11 object-contain max-w-[180px]"
              />
            </div>
          ))}
        </div>

        {/* Fade masks on the sides so logos appear/disappear smoothly */}
        <style jsx global>{`
          .Mask-Effect {
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          }
        `}</style>
      </div>
      </div>
    </section>
  );
};

export default TrustedBy;

