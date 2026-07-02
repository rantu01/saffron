"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Target, Eye, CheckCircle, TrendingUp, Users, Award } from 'lucide-react';
import ContactSection from '@/app/Component/Home/ContactSection';

const valuesData = [
  {
    letter: 'C',
    title: 'Client Centricity',
    description: 'We exist to create value for our clients that results in business outcomes for the client.',
    behaviors: [
      'Align all processes to client business objectives',
      'Proactively anticipate needs through structured feedback loops',
      'Measure success by the quality and impact of solutions delivered',
    ],
  },
  {
    letter: 'A',
    title: 'Agility',
    description: 'We adapt to stay ahead and embrace change while maintaining process integrity.',
    behaviors: [
      'Embrace change while maintaining process integrity',
      'Iterate quickly without compromising quality standards',
      'Leverage data-driven insights to pivot strategically',
    ],
  },
  {
    letter: 'R',
    title: 'Responsibility',
    description: 'We own outcomes with accountability. Follow through on commitments with process adherence.',
    behaviors: [
      'Follow through on commitments with process adherence',
      'Escalate risks early, proposing structured solutions',
      'Uphold quality in all decisions, balancing speed and precision',
    ],
  },
  {
    letter: 'M',
    title: 'Mastery',
    description: 'We pursue excellence through continuous improvement. Invest in skill development with a learning cadence.',
    behaviors: [
      'Invest in skill development with a learning cadence',
      'Apply process-oriented approaches to solve complex problems',
      'Deliver work that meets the highest quality standards',
    ],
  },
  {
    letter: 'A',
    title: 'Alignment through Collaboration',
    description: 'We win together through teamwork. Actively share knowledge and resources across teams.',
    behaviors: [
      'Actively share knowledge and resources across teams',
      'Respect process boundaries while working toward common goals',
      'Resolve conflicts constructively, focusing on quality outcomes',
    ],
  },
];

const leadershipData = [
  {
    name: 'Vibhu Satpaul',
    role: 'CEO & Co-founder',
  },
  {
    name: 'Gaurav Sabharwal',
    role: 'Co-founder',
  },
  {
    name: 'Sam Sanyal',
    role: 'Chief Growth Consultant',
  },
  {
    name: 'Josh Moody',
    role: 'C-Suite Relations',
  },
  {
    name: 'Sabah Noor',
    role: 'Head, Digital Sales',
  },
];

const statsData = [
  { icon: <Award size={32} />, value: '25+', label: 'Industries' },
  { icon: <Users size={32} />, value: '150+', label: 'Employees' },
  { icon: <TrendingUp size={32} />, value: '2,500+', label: 'Customers' },
];

const trustedBy = [
  'Clutch', 'Capterra', 'Google', 'Design Rush',
  'Responsify', 'Light Source', 'Gear Source', 'Martin',
  'Garden 22', 'Spatic', 'Solvecube', 'Kanbanze',
];

const journeyData = [
  { year: '2008', title: 'Foundation', description: 'Founded with a strong focus on technology-led SEO, helping early-stage businesses build sustainable organic visibility and digital foundations.' },
  { year: '2012', title: 'Growth', description: 'Expanded into content marketing and PPC management, enabling data-driven demand capture across organic and paid acquisition channels.' },
  { year: '2015', title: 'Global Expansion', description: 'Established offices in the United States, supporting global clients with localized strategies and cross-market search and growth expertise.' },
  { year: '2018', title: 'Enterprise Growth', description: 'Built a dedicated enterprise SEO practice to solve complex scale, governance, and performance challenges for large, multi-location organizations.' },
  { year: '2022', title: 'Industry Recognition', description: 'Recognized by leading publications in New Jersey as a top SEO agency for consistent performance, innovation, and client impact.' },
  { year: '2024', title: 'Dominating Search', description: 'Launched AI-driven SEO and intelligence tools to improve insights, execution speed, and measurable outcomes across search ecosystems.' },
  { year: '2026', title: 'Built to Scale', description: 'Engineered AI, automation, and proprietary systems to power modern GTM strategies aligned with AI engines, accelerating revenue growth.' },
];

export default function AboutUsPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

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
              About Us
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              We&apos;re not a just marketing agency.<br />
              <span className="text-[#E05305]">We are your growth partners.</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
              Saffron Edge is the #1 data-driven and revenue-focused marketing agency that turns managers into leaders, employees into high performers, and teams into goal-driven units.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="w-20 h-12 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400 font-medium">
                  Badge {i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="bg-[#FFEFE4] text-[#E05305] text-xs font-bold px-4 py-1.5 rounded-md mb-6 inline-block tracking-wide">
              Our Vision
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Empowering Businesses to <span className="text-[#E05305]">Evolve & Thrive</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              At Saffron Edge, we empower businesses to evolve, thrive, and excel by providing top-notch marketing solutions to businesses of all sizes. Our vision is to be the catalyst for consistent transformation, growth, and performance, driving businesses towards their full potential.
            </p>
          </div>
          <div className="bg-[#e0f3ff] rounded-3xl p-8 aspect-square flex items-center justify-center">
            <Eye size={80} className="text-[#2596D9]" />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="bg-[#e0f3ff] rounded-3xl p-8 aspect-square flex items-center justify-center lg:order-2">
            <Target size={80} className="text-[#2596D9]" />
          </div>
          <div className="lg:order-1">
            <span className="bg-[#FFEFE4] text-[#E05305] text-xs font-bold px-4 py-1.5 rounded-md mb-6 inline-block tracking-wide">
              Our Mission
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Winning <span className="text-[#E05305]">Together</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              We are the partners that your business needs to drive growth. Our mission is to be a leading digital marketing agency worldwide. Leveraging our diverse portfolio of strategies, tools, systems to deliver measurable results.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {statsData.map((stat, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-[#E05305] flex justify-center mb-4">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values - CARMA */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="bg-[#FFEFE4] text-[#E05305] text-xs font-bold px-4 py-1.5 rounded-md mb-4 inline-block tracking-wide">
              Our Core Values
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              CARMA — <span className="text-[#E05305]">What Drives Us</span>
            </h2>
          </div>

          <div className="space-y-12">
            {valuesData.map((val, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-16 items-center`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="w-14 h-14 bg-[#E05305] text-white text-2xl font-extrabold rounded-xl flex items-center justify-center">
                      {val.letter}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900">{val.title}</h3>
                  </div>
                  <p className="text-gray-600 text-lg mb-4">{val.description}</p>
                  <ul className="space-y-2">
                    {val.behaviors.map((b, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-600">
                        <CheckCircle size={18} className="text-[#22C55E] mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full">
                  <div className="bg-[#e0f3ff] rounded-3xl w-full aspect-[4/3] flex items-center justify-center">
                    <span className="text-6xl font-extrabold text-[#2596D9]/30">{val.letter}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="bg-[#FFEFE4] text-[#E05305] text-xs font-bold px-4 py-1.5 rounded-md mb-4 inline-block tracking-wide">
              Leadership
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Meet Our <span className="text-[#E05305]">Leadership</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We believe that goal-driven people inspire powerful action!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {leadershipData.map((person, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-gray-400">
                  {person.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="font-bold text-gray-900 text-base">{person.name}</h4>
                <p className="text-gray-500 text-sm mb-3">{person.role}</p>
                <Link href="#" className="inline-flex items-center gap-1 text-[#0077B5] text-sm hover:underline">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#0077B5" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Trusted <span className="text-[#E05305]">By</span>
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {trustedBy.map((brand, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg px-6 py-3 shadow-sm">
                <span className="text-gray-500 font-semibold text-sm">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="bg-[#FFEFE4] text-[#E05305] text-xs font-bold px-4 py-1.5 rounded-md mb-4 inline-block tracking-wide">
              Our Journey
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Building Scalable Growth Systems <span className="text-[#E05305]">Since 2008</span>
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-[#E05305]/20 -translate-x-1/2" />
            {journeyData.map((item, idx) => (
              <div key={idx} className={`relative flex items-start gap-8 mb-12 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className="hidden md:block flex-1 text-right">
                  {idx % 2 === 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <span className="text-[#E05305] font-extrabold text-lg">{item.year}</span>
                      <h4 className="font-bold text-gray-900 text-lg mt-1">{item.title}</h4>
                      <p className="text-gray-600 text-sm mt-2">{item.description}</p>
                    </div>
                  )}
                </div>
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-8 h-8 bg-[#E05305] rounded-full border-4 border-white shadow-md flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex-1 md:hidden">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <span className="text-[#E05305] font-extrabold text-lg">{item.year}</span>
                    <h4 className="font-bold text-gray-900 text-lg mt-1">{item.title}</h4>
                    <p className="text-gray-600 text-sm mt-2">{item.description}</p>
                  </div>
                </div>
                <div className="hidden md:block flex-1">
                  {idx % 2 !== 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <span className="text-[#E05305] font-extrabold text-lg">{item.year}</span>
                      <h4 className="font-bold text-gray-900 text-lg mt-1">{item.title}</h4>
                      <p className="text-gray-600 text-sm mt-2">{item.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-[#e0f3ff]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-6">
                Join us and <span className="text-[#E05305]">make your mark</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                We&apos;re not just building teams — we&apos;re nurturing people. At our core, we believe in giving everyone a fair voice, creative freedom, and the space to experiment, learn, and grow. If you&apos;re ready to shape the future with bold ideas and meaningful impact, you&apos;re in the right place.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#E05305] text-white font-bold px-8 py-3.5 rounded-lg shadow-md hover:bg-[#c84a04] transition-all"
              >
                Explore our careers <ArrowUpRight size={20} />
              </Link>
            </div>
            <div className="bg-white rounded-3xl p-8 aspect-[4/3] flex items-center justify-center shadow-sm">
              <span className="text-6xl">🚀</span>
            </div>
          </div>
        </div>
      </section>

      {/* Global Offices */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Find us <span className="text-[#E05305]">around the globe</span>
            </h2>
            <p className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto">
              From the heart of innovation in New Jersey to the fast-growing tech corridors of India, we operate as one global team.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
              <div className="w-16 h-16 bg-[#e0f3ff] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🇺🇸</span>
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-2">New Jersey</h4>
              <p className="text-gray-500 text-sm">Saffron Edge INC<br />169 BLVD, Suite 2A<br />Totowa, NJ 07512, USA</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
              <div className="w-16 h-16 bg-[#e0f3ff] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🇮🇳</span>
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-2">India</h4>
              <p className="text-gray-500 text-sm">Kh. No. 385, Gali No-1<br />Near 100 FT Road, Ghitorni<br />New Delhi 110030</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
              <div className="w-16 h-16 bg-[#e0f3ff] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌐</span>
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-2">Community</h4>
              <p className="text-gray-500 text-sm">We bless your inbox with trends<br />before they reach millions.</p>
              <Link href="/blog" className="text-[#E05305] font-semibold text-sm hover:underline mt-2 inline-block">Join our community</Link>
            </div>
          </div>
        </div>
      </section>

      <ContactSection />
    </div>
  );
}
