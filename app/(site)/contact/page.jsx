"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, ArrowRight } from 'lucide-react';

const contactInfo = [
  {
    icon: <Phone size={20} />,
    label: 'Phone',
    value: '(888) 807-7242',
    href: 'tel:+18888077242',
  },
  {
    icon: <Mail size={20} />,
    label: 'Email',
    value: 'sales@saffronedge.com',
    href: 'mailto:sales@saffronedge.com',
  },
  {
    icon: <MapPin size={20} />,
    label: 'Office',
    value: '169 BLVD, Suite 2A, Totowa, NJ 07512, USA',
    href: '#',
  },
  {
    icon: <Clock size={20} />,
    label: 'Hours',
    value: 'Mon – Fri: 9:00 AM – 6:00 PM',
    href: '#',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-orange-50">
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-[#FFF1E9] text-[#E05305] text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <Mail size={16} />
              Get in Touch
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Have a question or want to work with us? We would love to hear from you. Send us a message and we will respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  {contactInfo.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-[#FFF1E9] rounded-xl flex items-center justify-center shrink-0 text-[#E05305]">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-medium">{item.label}</p>
                        {item.href && item.href !== '#' ? (
                          <Link href={item.href} className="text-gray-900 font-semibold hover:text-[#E05305] transition-colors">
                            {item.value}
                          </Link>
                        ) : (
                          <p className="text-gray-900 font-semibold">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#FFF1E9] rounded-2xl p-8 border border-orange-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Need Help?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Our support team is available during business hours. You can also check our FAQ or browse the resources section for guides and tutorials.
                </p>
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-2 text-[#E05305] font-semibold text-sm hover:text-[#c84a04] transition-colors"
                >
                  Browse Resources
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Message Sent!
                  </h2>
                  <p className="text-gray-500">
                    Thank you for reaching out. We will get back to you shortly.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">
                    Send a Message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05305]/20 focus:border-[#E05305] transition-all bg-gray-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05305]/20 focus:border-[#E05305] transition-all bg-gray-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us what is on your mind..."
                        required
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05305]/20 focus:border-[#E05305] transition-all bg-gray-50/50 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#E05305] hover:bg-[#c84a04] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-200/50 flex items-center justify-center gap-2"
                    >
                      Send Message
                      <Send size={18} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
