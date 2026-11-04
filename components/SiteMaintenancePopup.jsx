"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import { Settings } from "lucide-react";

const POPUP_KEY = "maintenance_popup_shown";
const OPEN_EVENT = "maintenance-popup:open";

/**
 * Site Under Maintenance Popup component
 * - Shows automatically once per browser session on website entry
 * - Also shows when navigating to Dashboard for the first time in a session
 * - Gear button manually opens it regardless of sessionStorage (by setting force flag)
 * - Uses sessionStorage to track dismissal per session
 */
export default function SiteMaintenancePopup({
}) {
  const pathname = usePathname();
  const shouldAutoShow =
    pathname === "/" || pathname === "/user-dashboard" || pathname === "/admin";
  const [hasShownInSession, setHasShownInSession] = useState(() => {
    if (typeof window === "undefined") return false;
    const previouslyShown = sessionStorage.getItem(POPUP_KEY);
    return previouslyShown === "shown" || previouslyShown === "dismissed";
  });
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return shouldAutoShow && !sessionStorage.getItem(POPUP_KEY);
  });
  const animationRef = useAnimation();

  useEffect(() => {
    if (shouldAutoShow && !hasShownInSession) {
      const timer = window.setTimeout(() => {
        setIsOpen(true);
        setHasShownInSession(true);
        sessionStorage.setItem(POPUP_KEY, "shown");
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [hasShownInSession, shouldAutoShow]);

  useEffect(() => {
    const openManually = () => setIsOpen(true);
    window.addEventListener(OPEN_EVENT, openManually);
    return () => window.removeEventListener(OPEN_EVENT, openManually);
  }, []);

  const closePopup = () => {
    setIsOpen(false);
    sessionStorage.setItem(POPUP_KEY, "dismissed");
  };

  return (
    <motion.div
      aria-hidden={!isOpen}
      role="alertdialog"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? "" : "pointer-events-none"}`}
      style={{ visibility: isOpen ? "visible" : "hidden" }}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={closePopup}
        onMouseDown={(e) => e.stopPropagation()}
      />

      {/* Popup Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 flex items-center justify-center z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Center container */}
        <motion.div
          ref={animationRef}
          className="relative w-full max-w-md mx-auto bg-[#1a1a1a] border border-white/[0.06] rounded-2xl shadow-2xl transform overflow-hidden scale-95 opacity-0"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: isOpen ? 1 : 0.95, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Maintenance Content */}
          <div className="p-6 flex flex-col items-center gap-6">
            {/* Animated Icon */}
            <motion.div
              className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4"
              animate="rotate"
              transition={{ duration: 3, repeat: Infinity, ease: " ease " }}
            >
              <Settings
                size={40}
                className="text-amber-400"
                style={{ transform: "rotate(-20deg)" }}
              />
            </motion.div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-white text-center tracking-tight">
              Site Under Maintenance
            </h2>

            {/* Description */}
            <p className="text-base text-slate-400 text-center leading-relaxed">
              We&apos;re currently making improvements to provide you with a better experience.
              Some features may be temporarily unavailable. Thank you for your patience!
            </p>

            {/* Got It Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={closePopup}
              className="w-full max-w-md bg-[#FBBF24] text-slate-900 font-semibold py-3 rounded-xl text-xs font-bold tracking-wider transition-colors shadow-md shadow-amber-500/20"
            >
              Got It
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}