"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const SLIDE_INTERVAL = 2000;

const slides = [
  { id: 1, src: "/appbig2.png", alt: "App Dashboard Overview" },
  { id: 2, src: "/appbig2.png", alt: "Analytics Screen" },
  { id: 3, src: "/appbig2.png", alt: "Task Management" },
  { id: 4, src: "/appbig2.png", alt: "Earnings Report" },
  { id: 5, src: "/appbig2.png", alt: "Profile Settings" },
];

export default function ScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = slides.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [total]);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl shadow-lg ">
        <motion.div
          className="flex py-6"
          animate={{
            x: `calc(-${currentIndex * 45}% + 27.5%)`,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 28,
            mass: 1,
          }}
        >
          {slides.map((slide, index) => {
            const isActive = index === currentIndex;
            const isAdjacent =
              index === (currentIndex - 1 + total) % total ||
              index === (currentIndex + 1) % total;

            return (
              <div
                key={slide.id}
                className="min-w-[45%] px-2 flex justify-center"
              >
                <div
                  className={`rounded-2xl overflow-hidden  transition-all duration-300
                  ${isActive ? "scale-190 shadow-xl opacity-100" : isAdjacent ? "scale-90 shadow-sm opacity-60" : "scale-90 opacity-0"}`}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="w-full h-[420px] object-contain p-4"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-6 bg-[#E05305]"
                : "w-2 bg-slate-300 hover:bg-slate-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}