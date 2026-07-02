"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronUp } from 'lucide-react';
import ContactSection from '@/app/Component/Home/ContactSection';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'seo', label: 'Search Engine Optimization' },
  { id: 'marketing-automation', label: 'Marketing Automation' },
  { id: 'abm', label: 'Account-based Marketing' },
  { id: 'paid', label: 'Paid Marketing' },
  { id: 'cro', label: 'Conversion Rate Optimization' },
  { id: 'content', label: 'Content Marketing' },
  { id: 'web', label: 'Web Development' },
  { id: 'app', label: 'App Development' },
];

const testimonialsData = [
  {
    id: 1,
    category: 'seo',
    metric: '13% Increase in leads',
    text: "Saffron Edge's marketing strategies led to a 13% increase in leads and a 9.6% boost in sales. We proudly recommend Saffron Edge; working with them was genuinely pleasing.",
    name: 'Jessica Taylor',
    role: 'Accounting Software',
    initials: 'JT',
  },
  {
    id: 2,
    category: 'marketing-automation',
    metric: 'Faster Penalty recovery',
    text: 'Saffron Edge helped us recover from a Google penalty, restoring our performance and boosting revenue within 45 days. We are now back on track, and our revenue is exceeding expectations.',
    name: 'James Simmons',
    role: 'Ecommerce brand (Name under NDA)',
    initials: 'JS',
  },
  {
    id: 3,
    category: 'seo',
    metric: '69% website visitor growth',
    text: 'I had a great experience working with this team. They were proactive in their approach, and responded promptly to all my queries. I would definitely work with them again.',
    name: 'Jay Stack',
    role: 'Manufacturing company',
    initials: 'JS',
  },
  {
    id: 4,
    category: 'web',
    metric: '1.5x Lesser Time-to-Launch',
    text: 'Huge thank you to Joshua Moody, Amit Singh, Sakshi Singhal & the team at Saffron Edge for the beautiful new look! You have given us a brand-new look, improved navigation, and updated design to support educators and learners.',
    name: 'Christine Zuppa',
    role: 'Co-Founder, Making the Grade Project',
    initials: 'CZ',
  },
  {
    id: 5,
    category: 'seo',
    metric: '2x monthly sales growth',
    text: "Saffron's SEO services 2X'd our monthly sales from $100K to $200K, with plans to reach $300K next. It has been fantastic working with the team and working towards crossing our targets.",
    name: 'John Stewart',
    role: 'Stone Machinery and Equipment Ecommerce',
    initials: 'JS',
  },
  {
    id: 6,
    category: 'web',
    metric: '29% reduction in bounce rate',
    text: 'I really appreciated how Saffron Edge took the time to really gain a deep understanding of the project and our goals, allowing them to deliver a product that aligned with our expectations.',
    name: 'Jake Morris',
    role: 'Co-Founder, NestJoy',
    initials: 'JM',
  },
  {
    id: 7,
    category: 'app',
    metric: '47% decrease is bounce rate',
    text: 'The quality is exceptional. I love their work, and I appreciate our back-and-forth.',
    name: 'Xanare',
    role: 'President, Flexyn Global',
    initials: 'XA',
  },
  {
    id: 8,
    category: 'app',
    metric: '39% decrease in loading time',
    text: "They're very patient and attentive to our needs. Their ability to explain technical concepts while also quickly solving problems makes them a valuable partner.",
    name: 'Luis Mejer',
    role: 'President, 24/7 Nursing Care',
    initials: 'LM',
  },
  {
    id: 9,
    category: 'app',
    metric: '45% more subscribers',
    text: 'I feel reassured that I have hired a team of people who are very dedicated to my project.',
    name: 'Dean Caroleo',
    role: 'CEO, Symbiosis',
    initials: 'DC',
  },
  {
    id: 10,
    category: 'paid',
    metric: '45% increase in rental enquiries',
    text: 'Saffron Edge increased our website visitors and rental inquiries; they are fast, efficient, and committed partners. Collaborating with their team felt like having a close ally.',
    name: 'Sebrina Curet',
    role: 'Real estate company',
    initials: 'SC',
  },
];

export default function TestimonialsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);

  const filtered = activeCategory === 'all'
    ? testimonialsData
    : testimonialsData.filter((t) => t.category === activeCategory);

  const visibleTestimonials = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <section className="relative bg-[#f3ebfb] overflow-hidden">
        <div className="relative bg-white rounded-b-[120px] p-10 sm:p-16 md:p-20">
          <div
            className="absolute inset-0 z-0 opacity-[0.35]"
            style={{
              backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <span className="bg-[#FFEFE4] text-[#E05305] text-xs font-bold px-4 py-1.5 rounded-md mb-6 inline-block tracking-wide">
              Testimonials
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              What our customers <br className="hidden md:block" />
              <span className="text-[#E05305]">say about us</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
              We have learned a lot over these years and our clients have benefited. Hear directly from our clients how we have helped them overcome their most difficult business challenges.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="bg-[#E05305] text-white font-bold px-6 py-3 rounded-lg shadow-md hover:bg-[#c84a04] transition-all inline-flex items-center gap-2"
              >
                Submit a testimonial <ArrowUpRight size={18} />
              </Link>
              <Link
                href="/case-study"
                className="bg-white text-[#E05305] border border-[#E05305] font-bold px-6 py-3 rounded-lg hover:bg-orange-50 transition-all"
              >
                Our work
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-6 md:px-12 lg:px-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6">
            {['Top PPC', 'AWS', 'NASSCOM', 'Top SEO'].map((badge, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl px-8 py-4 shadow-sm">
                <span className="text-gray-500 font-bold text-sm tracking-wide">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-10 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setVisibleCount(6); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  activeCategory === cat.id
                    ? 'bg-[#E05305] text-white border-[#E05305] shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#E05305] hover:text-[#E05305]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-10 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto px-4">
          {visibleTestimonials.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No testimonials found for this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleTestimonials.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Metric */}
                  <div className="flex items-center gap-2 mb-4">
                    <ChevronUp size={18} className="text-[#22C55E]" />
                    <span className="text-[#22C55E] font-semibold text-sm">{item.metric}</span>
                  </div>

                  {/* Text */}
                  <p className="text-gray-700 text-base leading-relaxed mb-6 min-h-[80px]">
                    {item.text}
                  </p>

                  {/* User */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E05305]/10 rounded-full flex items-center justify-center text-[#E05305] font-bold text-sm">
                      {item.initials}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-gray-500 text-xs">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-12">
              <button
                onClick={handleLoadMore}
                className="border-2 border-[#E05305] text-[#E05305] font-semibold px-8 py-3 rounded-lg hover:bg-[#E05305] hover:text-white transition-all shadow-[0_4px_0_0_#D94E1F] active:translate-y-[2px] active:shadow-[0_2px_0_0_#D94E1F]"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </section>

      <ContactSection />
    </div>
  );
}
