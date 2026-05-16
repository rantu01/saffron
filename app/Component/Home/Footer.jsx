"use client";

import React from 'react';
import Link from 'next/link';
import { Phone, Mail } from 'lucide-react'; // কন্টাক্ট আইকনের জন্য

const Footer = () => {
  return (
    <footer className="relative w-full bg-white text-gray-800 pt-16 pb-8 px-6 md:px-12 lg:px-24 border-t border-gray-100 overflow-hidden font-sans">
      
      {/* ১. ডট গ্রিড ব্যাকগ্রাউন্ড (Dot Grid Background Effect) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* মেইন গ্রিড লেআউট */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-gray-200/60">
          
          {/* কলাম ১: নিউজলেটার সাবস্ক্রিপশন ফর্ম (৪ স্প্যান) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <form className="w-full max-w-sm flex flex-col gap-3.5">
              <input 
                type="email" 
                placeholder="Email" 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#E05305] focus:border-[#E05305] text-sm text-gray-900 bg-white"
                required
              />
              <input 
                type="text" 
                placeholder="Name" 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#E05305] focus:border-[#E05305] text-sm text-gray-900 bg-white"
                required
              />
              
              {/* ডামি reCAPTCHA বক্স */}
              <div className="w-full p-3 bg-[#F9F9F9] border border-gray-200 rounded-md flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500" required />
                  <span className="text-sm font-medium text-gray-700">I'm not a robot</span>
                </label>
                <div className="flex flex-col items-center justify-center text-[10px] text-gray-400">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/RecaptchaLogo.svg" alt="reCAPTCHA" className="w-6 h-6 object-contain" />
                  <span>reCAPTCHA</span>
                </div>
              </div>

              {/* Subscribe Button */}
              <button 
                type="submit" 
                className="w-full bg-[#E05305] text-white font-bold py-3.5 px-6 rounded-lg shadow-md hover:bg-[#c84a04] transition-all text-center tracking-wide"
              >
                Subscribe
              </button>
            </form>

            {/* সোশ্যাল মিডিয়া আইকন রো */}
            <div className="flex items-center gap-4 mt-2">
              <Link href="#" className="w-5 h-5 flex items-center justify-center text-gray-800 hover:text-[#E05305] transition-colors font-bold">✒️</Link>
              <Link href="#" className="w-5 h-5 flex items-center justify-center bg-black text-white text-xs rounded-xs font-black tracking-tighter">X</Link>
              <Link href="#" className="text-blue-600 text-xl hover:opacity-80">🔵</Link> {/* Facebook Placeholder */}
              <Link href="#" className="text-pink-600 text-xl hover:opacity-80">📸</Link> {/* Instagram Placeholder */}
              <Link href="#" className="text-blue-700 text-xl hover:opacity-80">💼</Link> {/* LinkedIn Placeholder */}
              <Link href="#" className="text-red-600 text-xl hover:opacity-80">▶️</Link> {/* YouTube Placeholder */}
            </div>
          </div>

          {/* কলাম ২: Services লিংকসমূহ (২ স্প্যান) */}
          <div className="lg:col-span-2">
            <h4 className="text-gray-950 font-extrabold text-base mb-4 tracking-tight">Services</h4>
            <ul className="space-y-2.5 text-sm text-gray-600 font-medium">
              {["Search Engine Optimization", "Digital Marketing Services", "Account-based Marketing", "Conversion Rate Optimization", "Marketing Automation", "Paid Media Marketing", "Social Media Marketing", "Content Marketing"].map((link, i) => (
                <li key={i}><Link href="#" className="hover:text-[#E05305] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* কলাম ৩: Resources লিংকসমূহ (২ AM) */}
          <div className="lg:col-span-2">
            <h4 className="text-gray-950 font-extrabold text-base mb-4 tracking-tight">Resources</h4>
            <ul className="space-y-2.5 text-sm text-gray-600 font-medium">
              {["Blogs", "E-books", "Calculators", "Toolkits", "Templates", "Glossary"].map((link, i) => (
                <li key={i}><Link href="#" className="hover:text-[#E05305] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* কলাম ৪: Company লিংকসমূহ (২ স্প্যান) */}
          <div className="lg:col-span-2">
            <h4 className="text-gray-950 font-extrabold text-base mb-4 tracking-tight">Company</h4>
            <ul className="space-y-2.5 text-sm text-gray-600 font-medium">
              {["About Us", "Case Studies", "Careers", "Testimonials"].map((link, i) => (
                <li key={i}><Link href="#" className="hover:text-[#E05305] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* কলাম ৫: Contact & Address (২ স্প্যান) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <h4 className="text-gray-950 font-extrabold text-base mb-4 tracking-tight">Contact</h4>
              <div className="space-y-3 text-sm text-gray-600 font-medium">
                <p className="flex items-center gap-2 whitespace-nowrap">
                  <Phone size={14} className="text-gray-800" /> Sales: <span className="text-gray-500">(888) 807-7242</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-800" /> <Link href="mailto:sales@saffronedge.com" className="hover:text-[#E05305] transition-colors">sales@saffronedge.com</Link>
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-gray-950 font-extrabold text-base mb-3 tracking-tight">Our Address</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Saffron Edge INC 169 BLVD,<br />
                Suite 2A Totowa,<br />
                NJ 07512, USA
              </p>
            </div>
          </div>

        </div>

        {/* নিচের কপিরাইট ও লিগ্যাল পার্ট */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6 relative">
          
          {/* লোগো ব্র্যান্ডিং */}
          <div className="flex items-center text-3xl font-extrabold tracking-tight z-10 mb-4 md:mb-6">
            <span className="text-[#E05305]">saffron</span>
            <span className="text-[#2596D9]">edge</span>
          </div>

          {/* কপিরাইট এবং লিগ্যাল লিংকসমূহ */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-sm text-gray-500 font-medium w-full md:w-auto justify-between md:justify-end">
            <span className="md:absolute md:left-0 md:bottom-0 text-gray-500">
              Copyright © 2026 Saffron Edge
            </span>
            <div className="flex items-center gap-4 md:gap-6 z-10">
              <Link href="#" className="hover:text-[#E05305] transition-colors">Sitemap</Link>
              <span className="text-gray-200">|</span>
              <Link href="#" className="hover:text-[#E05305] transition-colors">Terms & Conditions</Link>
              <span className="text-gray-200">|</span>
              <Link href="#" className="hover:text-[#E05305] transition-colors">Privacy Policy</Link>
            </div>
          </div>

          {/* ডানদিকের নিচে হালকা অরেঞ্জ ফ্যাক্টরি আর্ট ওয়াটারমার্ক (Inline SVG) */}
          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none hidden lg:block">
            <svg width="180" height="120" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 120 V80 H50 V90 H80 V60 H110 V40 C110 20 130 20 130 40 V60 H160 V120 Z" stroke="#E05305" strokeWidth="1.5" />
              <path d="M50 80 C50 60 70 60 70 80" stroke="#E05305" strokeWidth="1.5" />
              <path d="M80 60 C80 45 95 45 95 60" stroke="#E05305" strokeWidth="1.5" />
            </svg>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;