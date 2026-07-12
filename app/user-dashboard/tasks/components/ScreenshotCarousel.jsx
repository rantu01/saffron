"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const SLIDE_INTERVAL = 2000;

const slides = [
  { id: 1, src: "/appbig2.png", alt: "App Dashboard Overview" },
  { id: 2, src: "/appbig3.png", alt: "Analytics Screen" },
  { id: 3, src: "/appbig4.png", alt: "Task Management" },
  { id: 4, src: "/appbig5.png", alt: "Earnings Report" },
  { id: 5, src: "/appbig6.png", alt: "Profile Settings" },
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
    <section className="w-full shrink-0">
      <div className="relative  rounded-xl shadow-sm p-2">
        <motion.div
          className="flex py-3"
          animate={{
            x: `calc(-${currentIndex * 45}% + 27.5%)`,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20 ,
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
                className="min-w-[45%] p-5 flex justify-center"
              >
                <div
                  className={`rounded-xl overflow-visible transition-all duration-300
                  ${isActive ? "scale-140 shadow-md opacity-100 " : isAdjacent ? "scale-130 shadow-sm opacity-50" : "scale-85 opacity-0"}`}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="w-full h-[200px] object-contain p-2 rounded-xl bg-white"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* <div className="flex justify-center gap-1.5 mt-1">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-4 bg-[#E05305]"
                : "w-1.5 bg-slate-300 hover:bg-slate-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div> */}
    </section>
  );
}