"use client"; // Next.js App Router ব্যবহার করলে এটি জরুরি

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { X, ChevronDown, LayoutGrid, BookOpen, FileCode, Calculator, Briefcase, Bookmark, User, Star, Search, Sparkles, Rocket, Megaphone } from 'lucide-react'; // আইকনের জন্য lucide-react ব্যবহার করা হয়েছে
import { useAuth } from '@/app/Component/Auth/AuthProvider';

const Navbar = () => {
  // ব্যানারটি দেখাবে কি দেখাবে না তা ট্র্যাক করার জন্য state
  // শুধুমাত্র হোমপেজে দেখানো হবে — অন্য পেজে অটো hide হবে
  const [showBanner, setShowBanner] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadRole() {
      if (!user?.uid) return setRole(null);
      try {
        const res = await fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`);
        const data = await res.json();
        if (mounted && data?.success) setRole(data.dashboard?.role || null);
      } catch (e) {
        if (mounted) setRole(null);
      }
    }

    loadRole();
    return () => (mounted = false);
  }, [user?.uid]);

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

  const companyDropdownItems = [
    { id: 'about-us', label: 'About Us', icon: <User size={16} /> },
    { id: 'testimonials', label: 'Testimonials', icon: <Star size={16} /> },
  ];

  const servicesMegaMenu = [
    {
      title: 'SEO Services',
      icon: <Search size={18} />,
      links: [
        { label: 'Search Engine Optimization (SEO)', href: '/services/seo' },
        { label: 'Technical SEO Services', href: '/services/technical-seo' },
        { label: 'Enterprise SEO Services', href: '/services/enterprise-seo' },
        { label: 'Website Migration Services', href: '/services/migration' },
        { label: 'SEO Lead Generation', href: '/services/seo-lead-generation' },
        { label: 'Local SEO Agency', href: '/services/local-seo' },
        { label: 'SEO Company in NJ', href: '/services/seo-nj' },
      ],
    },
    {
      title: 'AI Search & LLM SEO',
      icon: <Sparkles size={18} />,
      links: [
        { label: 'AI SEO Agency', href: '/services/ai-seo' },
        { label: 'Answer Engine Optimization (AEO)', href: '/services/aeo' },
        { label: 'Generative Engine Optimization (GEO)', href: '/services/geo' },
        { label: 'ChatGPT SEO', href: '/services/chatgpt-seo' },
        { label: 'Claude SEO', href: '/services/claude-seo' },
        { label: 'Gemini SEO', href: '/services/gemini-seo' },
        { label: 'Perplexity SEO', href: '/services/perplexity-seo' },
      ],
    },
    {
      title: 'Digital Marketing & Growth',
      icon: <Rocket size={18} />,
      links: [
        { label: 'Digital Marketing Services', href: '/services/digital-marketing' },
        { label: 'Account-Based Marketing (ABM)', href: '/services/abm' },
        { label: 'Marketing Automation', href: '/services/marketing-automation' },
        { label: 'Conversion Rate Optimization (CRO)', href: '/services/cro' },
        { label: 'Go-to-Market Consulting', href: '/services/gtm' },
        { label: 'SaaS SEO Agency', href: '/services/saas-seo' },
      ],
    },
    {
      title: 'Paid, Social & Content',
      icon: <Megaphone size={18} />,
      links: [
        { label: 'Paid Media Marketing', href: '/services/paid-media' },
        { label: 'Social Media Marketing (SMM)', href: '/services/smm' },
        { label: 'Content Marketing', href: '/services/content-marketing' },
        { label: 'Link Building Services', href: '/services/link-building' },
      ],
    },
  ];

  return (
    <header className="w-full font-sans sticky top-0 z-50">
      {/* ১. উপরের কমলা রঙের Alert Banner */}
      {/* {showBanner && (
        <div className="w-full bg-[#E05305] text-white py-2.5 px-4 flex justify-between items-center relative transition-all duration-300">
          
          <div className="flex-1 text-center text-sm md:text-base font-medium flex justify-center items-center gap-1 cursor-pointer hover:underline">
            <span>Free Toolkit Alert: Get The Ultimate Marketing Toolkit with 200+ Tools</span>
            <span className="text-xs">❯</span>
          </div>

          
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close banner"
          >
            <X size={18} />
          </button>
        </div>
      )} */}

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
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-[#E05305] transition-colors cursor-pointer">
                Services <ChevronDown size={16} className="mt-0.5" />
              </button>

              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 z-40 opacity-0 translate-y-3 scale-y-95 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-y-100 group-hover:pointer-events-auto transition-all duration-300 ease-out origin-top">
                <div className="w-[920px] bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/5 py-7 px-7">
                  <div className="grid grid-cols-4 gap-5">
                    {servicesMegaMenu.map((column, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                          <span className="text-[#E05305] bg-[#FFF1E9] p-1.5 rounded-lg">{column.icon}</span>
                          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">{column.title}</span>
                        </div>
                        <ul className="space-y-0.5">
                          {column.links.map((link, linkIdx) => (
                            <li key={linkIdx}>
                              <Link
                                href={link.href}
                                className="group/link relative block text-sm text-gray-600 hover:text-[#E05305] px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-[#FFF9F5] hover:to-transparent hover:pl-4"
                              >
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-[#E05305] rounded-full transition-all duration-200 group-hover/link:h-4"></span>
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* <Link href="/case-study" className="hover:text-[#E05305] transition-colors whitespace-nowrap">
              Case Studies
            </Link> */}

            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-[#E05305] transition-colors cursor-pointer">
                Company <ChevronDown size={16} className="mt-0.5" />
              </button>

              <div className="absolute left-0 top-full pt-4 z-40 opacity-0 translate-y-[-12px] pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 ease-out">
                <div className="w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2">
                  {companyDropdownItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/${item.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#FFF1E9] hover:text-[#E05305] transition-colors"
                    >
                      <span className="text-gray-400">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
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

            {/* <div className="hidden md:flex items-center gap-3">
              {!loading && user && role !== 'admin' && (
                <Link
                  href="/user-dashboard"
                  className="border border-slate-300 text-slate-700 px-6 py-2.5 rounded-md font-semibold text-base hover:bg-gray-100 transition-colors inline-block"
                >
                  Dashboard
                </Link>
              )}

              {!loading && user && role === 'admin' && (
                <Link
                  href="/admin"
                  className="ml-3 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-md font-semibold text-base hover:bg-gray-100 transition-colors inline-block"
                >
                  Admin
                </Link>
              )}

              {!loading && !user && (
                <Link
                  href="/login"
                  className="border border-[#E05305] text-[#E05305] px-6 py-2.5 rounded-md font-semibold text-base hover:bg-[#FFF1E9] transition-colors inline-block"
                >
                  Login
                </Link>
              )}

              {!loading && user && (
                <button
                  onClick={logout}
                  className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-md font-semibold text-base hover:bg-gray-100 transition-colors inline-block"
                >
                  Logout
                </button>
              )}

              
            </div> */}
            <Link
              href="/contact"
              className="bg-[#E05305] text-white px-6 py-2.5 rounded-md font-semibold text-base hover:bg-[#c84a04] transition-colors inline-block"
            >
              Contact Us
            </Link>
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
          <div className="p-6 h-[calc(100%] overflow-y-auto">
            <nav className="flex flex-col gap-2 text-gray-800 font-medium">
              <div className="flex flex-col gap-1">
                <Link href="/services" onClick={() => setMobileOpen(false)} className="w-full p-3 rounded-md hover:bg-[#FFF1E9] transition-colors">
                  Services
                </Link>
                <div className="pl-4 flex flex-col gap-1 text-sm text-gray-600">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1 mb-0.5">SEO Services</span>
                  <Link href="/services/seo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Search Engine Optimization (SEO)</Link>
                  <Link href="/services/technical-seo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Technical SEO Services</Link>
                  <Link href="/services/enterprise-seo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Enterprise SEO Services</Link>
                  <Link href="/services/migration" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Website Migration Services</Link>
                  <Link href="/services/seo-lead-generation" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• SEO Lead Generation</Link>
                  <Link href="/services/local-seo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Local SEO Agency</Link>
                  <Link href="/services/seo-nj" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• SEO Company in NJ</Link>

                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2 mb-0.5">AI Search & LLM SEO</span>
                  <Link href="/services/ai-seo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• AI SEO Agency</Link>
                  <Link href="/services/aeo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Answer Engine Optimization (AEO)</Link>
                  <Link href="/services/geo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Generative Engine Optimization (GEO)</Link>
                  <Link href="/services/chatgpt-seo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• ChatGPT SEO</Link>
                  <Link href="/services/claude-seo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Claude SEO</Link>
                  <Link href="/services/gemini-seo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Gemini SEO</Link>
                  <Link href="/services/perplexity-seo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Perplexity SEO</Link>

                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2 mb-0.5">Digital Marketing & Growth</span>
                  <Link href="/services/digital-marketing" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Digital Marketing Services</Link>
                  <Link href="/services/abm" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Account-Based Marketing (ABM)</Link>
                  <Link href="/services/marketing-automation" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Marketing Automation</Link>
                  <Link href="/services/cro" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Conversion Rate Optimization (CRO)</Link>
                  <Link href="/services/gtm" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Go-to-Market Consulting</Link>
                  <Link href="/services/saas-seo" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• SaaS SEO Agency</Link>

                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2 mb-0.5">Paid, Social & Content</span>
                  <Link href="/services/paid-media" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Paid Media Marketing</Link>
                  <Link href="/services/smm" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Social Media Marketing (SMM)</Link>
                  <Link href="/services/content-marketing" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Content Marketing</Link>
                  <Link href="/services/link-building" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">• Link Building Services</Link>
                </div>
              </div>

              {/* <Link href="/case-study" onClick={() => setMobileOpen(false)} className="w-full p-3 rounded-md hover:bg-[#FFF1E9] transition-colors">
                Case Studies
              </Link> */}

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

              <div className="flex flex-col gap-1">
                <span className="w-full p-3 rounded-md text-gray-800 font-medium">
                  Company
                </span>
                <div className="pl-4 flex flex-col gap-1 text-sm text-gray-600">
                  <Link href="/about-us" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">
                    • About Us
                  </Link>
                  <Link href="/testimonials" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-[#FFF1E9] transition-colors">
                    • Testimonials
                  </Link>
                </div>
              </div>
            </nav>
          </div>

          {/* Footer / CTA */}
          <div className="p-6 border-t absolute bottom-0 left-0 right-0 bg-white">
            {!loading && user && role !== 'admin' && (
              <Link
                href="/user-dashboard"
                onClick={() => setMobileOpen(false)}
                className="mb-3 block border border-slate-300 text-slate-700 text-center py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                Dashboard
              </Link>
            )}

            {!loading && user && role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="mb-3 block border border-slate-300 text-slate-700 text-center py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                Admin
              </Link>
            )}

            {!loading && !user && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mb-3 block border border-[#E05305] text-[#E05305] text-center py-3 rounded-md font-medium hover:bg-[#FFF1E9] transition-colors"
              >
                Login
              </Link>
            )}

            {!loading && user && (
              <button
                onClick={async () => {
                  await logout();
                  setMobileOpen(false);
                }}
                className="mb-3 block w-full border border-gray-300 text-gray-700 text-center py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            )}

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