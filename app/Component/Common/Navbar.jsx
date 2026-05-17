"use client"; // Next.js App Router ব্যবহার করলে এটি জরুরি

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { X, ChevronDown, LayoutGrid, BookOpen, FileCode, Calculator, Briefcase, Bookmark } from 'lucide-react'; // আইকনের জন্য lucide-react ব্যবহার করা হয়েছে

const Navbar = () => {
  // ব্যানারটি দেখাবে কি দেখাবে না তা ট্র্যাক করার জন্য state
  // শুধুমাত্র হোমপেজে দেখানো হবে — অন্য পেজে অটো hide হবে
  const [showBanner, setShowBanner] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setShowBanner(pathname === '/');
  }, [pathname]);

  const resourcesDropdownItems = [
    { id: 'ebook', label: 'Ebook', icon: <BookOpen size={16} /> },
    { id: 'templates', label: 'Templates', icon: <FileCode size={16} /> },
    { id: 'calculators', label: 'Calculators', icon: <Calculator size={16} /> },
    { id: 'toolkits', label: 'Toolkits', icon: <Briefcase size={16} /> },
    { id: 'glossary', label: 'Glossary', icon: <Bookmark size={16} /> },
  ];

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
            <Link href="/services" className="flex items-center gap-1 hover:text-[#E05305] transition-colors">
              Services <ChevronDown size={16} className="mt-0.5" />
            </Link>

            <Link href="/case-study" className="hover:text-[#E05305] transition-colors">
              Case Studies
            </Link>

            <div className="relative group">
              <Link href="/resources" className="flex items-center gap-1 hover:text-[#E05305] transition-colors">
                Resources <ChevronDown size={16} className="mt-0.5" />
              </Link>

              <div className="absolute left-0 top-full pt-4 z-40 opacity-0 translate-y-[-12px] pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 ease-out">
                <div className="w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2">
                  {resourcesDropdownItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/resources?tab=${item.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#FFF1E9] hover:text-[#E05305] transition-colors"
                    >
                      <span className="text-gray-400">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <button className="flex items-center gap-1 hover:text-[#E05305] transition-colors">
              Company <ChevronDown size={16} className="mt-0.5" />
            </button>
          </div>

          {/* ডানদিকের Contact Us বাটন + মোবাইল হ্যামবার */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-md focus:outline-none"
              aria-label="Open menu"
            >
              <span className="sr-only">Open menu</span>
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className="block h-[2px] bg-gray-800 rounded"></span>
                <span className="block h-[2px] bg-gray-800 rounded"></span>
                <span className="block h-[2px] bg-gray-800 rounded"></span>
              </div>
            </button>

            <div className="hidden md:block">
              <Link
                href="/contact"
                className="bg-[#E05305] text-white px-6 py-2.5 rounded-md font-semibold text-base hover:bg-[#c84a04] transition-colors inline-block"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

      </nav>

      {/* Mobile Drawer (right side) */}
      <div className={`fixed inset-0 z-50 transition-all ${mobileOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ease-in-out ${mobileOpen ? 'opacity-100' : 'opacity-0'
            }`}
        />

        {/* Drawer Body */}
        <aside
          className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b">
            <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
              <Image
                src="/imgi_114_b1hwuyvwud51xaw9fnyu.webp"
                alt="saffronedge logo"
                width={120}
                height={34}
                className="object-contain"
              />
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-6 h-[calc(100%-145px)] overflow-y-auto">
            <nav className="flex flex-col gap-2 text-gray-800 font-medium">
              <Link href="/services" onClick={() => setMobileOpen(false)} className="w-full p-3 rounded-md hover:bg-[#FFF1E9] transition-colors">
                Services
              </Link>

              <Link href="/case-study" onClick={() => setMobileOpen(false)} className="w-full p-3 rounded-md hover:bg-[#FFF1E9] transition-colors">
                Case Studies
              </Link>

              {/* Resources Section with Sub-links */}
              <div className="flex flex-col gap-1">
                <Link href="/resources" onClick={() => setMobileOpen(false)} className="w-full p-3 rounded-md hover:bg-[#FFF1E9] transition-colors">
                  Resources
                </Link>
                <div className="pl-4 flex flex-col gap-1 text-sm text-gray-600">
                  <Link href="/resources?tab=ebook" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">
                    • Ebook
                  </Link>
                  <Link href="/resources?tab=templates" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">
                    • Templates
                  </Link>
                  <Link href="/resources?tab=calculators" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">
                    • Calculators
                  </Link>
                </div>
              </div>

              <Link href="/company" onClick={() => setMobileOpen(false)} className="w-full p-3 rounded-md hover:bg-[#FFF1E9] transition-colors">
                Company
              </Link>
            </nav>
          </div>

          {/* Footer / CTA */}
          <div className="p-6 border-t absolute bottom-0 left-0 right-0 bg-white">
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block bg-[#E05305] text-white text-center py-3 rounded-md font-medium hover:bg-[#c84a04] transition-colors shadow-sm"
            >
              Contact Us
            </Link>
          </div>
        </aside>
      </div>
    </header>
  );
};

export default Navbar;