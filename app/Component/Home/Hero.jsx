import React from 'react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative w-full min-h-[60vh] flex flex-col items-center pb-10 justify-center text-center  overflow-hidden bg-[#f3ebfb]">

      {/* Dot grid moved inside the white card below */}

      {/* কনটেন্ট এরিয়া (এটিকে ব্যাকগ্রাউন্ডের উপরে রাখার জন্য z-10) */}
      <div className="relative mx-auto w-full">
        <div className="relative bg-white rounded-b-[120px] rounded-t-lg p-10 sm:p-16 flex flex-col items-center">
          <div
            className="absolute inset-0 z-0 opacity-[0.35]"
            style={{
              backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative z-10 max-w-6xl w-full flex flex-col items-center">
            {/* ২. উপরের ছোট ব্যাজ (New: How to Rank...) */}
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200/80 rounded-lg px-3 py-1.5 shadow-sm text-sm font-medium text-gray-800 mb-8 backdrop-blur-sm">
              <span className="bg-[#EAF5FF] text-[#1E88E5] text-xs font-bold px-2 py-0.5 rounded border border-[#D0E7FF]">
                New
              </span>
              <span className="text-gray-700 font-normal">How to Rank in AI Overviews</span>
            </div>

            {/* ৩. মেইন হেডিং (Main Heading) */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-[1.15] max-w-3xl mb-6">
              Turn Customer Engagement into <br />
              <span className="block mt-1">Revenue Growth</span>
            </h1>

            {/* ৪. সাব-হেডিং / বিবরণ (Description) */}
            <p className="text-gray-600 text-base md:text-lg max-w-2xl leading-relaxed mb-10 font-normal">
              We combine marketing funnels with growth loops to create sustainable revenue growth. Join 2500+ industry leaders who've scaled 3x with Saffron Edge.
            </p>

            {/* ৫. ছোট টেক্সট (Unable to hit revenue targets?) */}
            <p className="text-gray-500 text-sm md:text-base font-medium mb-4">
              Unable to hit revenue targets?
            </p>

            {/* ৬. কল-টু-অ্যাকশন বাটনসমূহ (CTA Buttons) */}
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-10 w-full sm:w-auto">
              {/* Book Intro Call Button */}
              <Link
                href="/book-call"
                className="w-full sm:w-auto bg-[#E05305] text-white font-bold px-8 py-3.5 rounded-lg shadow-md hover:bg-[#c84a04] transition-all text-center min-w-[180px]"
              >
                Book Intro Call
              </Link>

              {/* Case Studies Button */}
              <Link
                href="/case-studies"
                className="w-full sm:w-auto bg-white text-[#E05305] border border-[#E05305] font-bold px-8 py-3.5 rounded-lg shadow-sm hover:bg-orange-50/50 transition-all text-center min-w-[180px]"
              >
                Case Studies
              </Link>
            </div>

            {/* ৭. রেটিং সেকশন (Google & Clutch Ratings) */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 font-medium">
              {/* Google Rating */}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center font-bold text-xs text-blue-600">
                  G
                </span>
                <span>
                  4.8 <span className="underline cursor-pointer text-gray-500 hover:text-gray-700">Rating on Google</span>
                </span>
              </div>

              {/* Clutch Rating */}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 bg-[#142A3A] shadow-sm rounded-full flex items-center justify-center font-bold text-[10px] text-red-500">
                  C
                </span>
                <span>
                  4.8 <span className="underline cursor-pointer text-gray-500 hover:text-gray-700">Rating on Clutch</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* নিচে বাম ও ডান পাশের হালকা কার্ভ বা শ্যাডো ইফেক্টের জন্য অপশনাল ডিজাইন */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50/30 to-transparent pointer-events-none" />
    </section>
  );
};

export default Hero;