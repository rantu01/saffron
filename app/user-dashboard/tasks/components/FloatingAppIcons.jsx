"use client";

import { motion } from "framer-motion";

const icons = [
  {
    id: 1,
    src: "/Saffron Logo/imgi_29_talent-logo.webp",
    alt: "Talent App",
  },
  {
    id: 2,
    src: "/Saffron Logo/imgi_30_rlent-logo.webp",
    alt: "Rlent App",
  },
  {
    id: 3,
    src: "/Saffron Logo/imgi_31_frame-1171279456.webp",
    alt: "Frame App",
  },
  {
    id: 4,
    src: "/Saffron Logo/imgi_32_gck-logo.webp",
    alt: "GCK App",
  },
  {
    id: 5,
    src: "/Saffron Logo/imgi_33_drbren-logo.webp",
    alt: "Drbren App",
  },
  {
    id: 6,
    src: "/Saffron Logo/imgi_34_spatic-logo.webp",
    alt: "Spatic App",
  },
  {
    id: 7,
    src: "/Saffron Logo/imgi_35_solvecube-logo.webp",
    alt: "Solvecube App",
  },
  {
    id: 8,
    src: "/Saffron Logo/imgi_36_empwise-logo.webp",
    alt: "Empwise App",
  },
];

export default function FloatingAppIcons() {
  return (
    <section className="w-full overflow-hidden py-6">
      <motion.div
        className="flex gap-4 md:gap-6 will-change-transform"
        animate={{ x: [0, -1000] }}
        transition={{
          repeat: Infinity,
          duration: 10, 
          ease: "linear",
        }}
      >
        {[...icons, ...icons].map((icon, index) => (
          <motion.div
            key={`${icon.id}-${index}`}
            className="shrink-0 will-change-transform"
            animate={{
              rotate: [0, 45, -45, 45, 0],
              y: [0, -6, 0, -3, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
              delay: (index % icons.length) * 0.12,
            }}
          >
            <img
              src={icon.src}
              alt={icon.alt}
              className="w-20 h-20 md:w-12 md:h-12 rounded-xl object-contain bg-white shadow-sm p-1.5"
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
