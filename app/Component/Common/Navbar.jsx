"use client"; // Next.js App Router ব্যবহার করলে এটি জরুরি

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ChevronDown } from 'lucide-react'; // আইকনের জন্য lucide-react ব্যবহার করা হয়েছে

const Navbar = () => {
  // ব্যানারটি দেখাবে কি দেখাবে না তা ট্র্যাক করার জন্য state
  const [showBanner, setShowBanner] = useState(true);

  return (
    <header className="w-full font-sans sticky top-0 z-50">
      {/* ১. উপরের কমলা রঙের Alert Banner */}
      {showBanner && (
        <div className="w-full bg-[#E05305] text-white py-2.5 px-4 flex justify-between items-center relative transition-all duration-300">
          {/* মাঝখানের টেক্সট এবং লিংক */}
          <div className="flex-1 text-center text-sm md:text-base font-medium flex justify-center items-center gap-1 cursor-pointer hover:underline">
            <span>Free Toolkit Alert: Get The Ultimate Marketing Toolkit with 200+ Tools</span>
            <span className="text-xs">❯</span>
          </div>

          {/* ডানদিকের ক্লোজ (Cross) বাটন */}
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close banner"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ২. মূল নেভিগেশন বার (Main Navbar) */}
      <nav className="w-full bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center ">

        <div className="max-w-7xl mx-auto flex justify-between items-center w-full px-4">

          {/* লোগো সেকশন */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/imgi_114_b1hwuyvwud51xaw9fnyu.webp"
                alt="saffronedge logo"
                width={140}
                height={40}
                className="object-contain"
              />
            </Link>
          </div>

          {/* মাঝখানের মেনু লিংকসমূহ */}
          <div className="hidden md:flex items-center gap-8 text-gray-800 font-medium text-base">
            <button className="flex items-center gap-1 hover:text-[#E05305] transition-colors">
              Services <ChevronDown size={16} className="mt-0.5" />
            </button>

            <Link href="/case-studies" className="hover:text-[#E05305] transition-colors">
              Case Studies
            </Link>

            <button className="flex items-center gap-1 hover:text-[#E05305] transition-colors">
              Resources <ChevronDown size={16} className="mt-0.5" />
            </button>

            <button className="flex items-center gap-1 hover:text-[#E05305] transition-colors">
              Company <ChevronDown size={16} className="mt-0.5" />
            </button>
          </div>

          {/* ডানদিকের Contact Us বাটন */}
          <div>
            <Link
              href="/contact"
              className="bg-[#E05305] text-white px-6 py-2.5 rounded-md font-semibold text-base hover:bg-[#c84a04] transition-colors inline-block"
            >
              Contact Us
            </Link>
          </div>
        </div>

      </nav>
    </header>
  );
};

export default Navbar;