import React from 'react';
import Link from 'next/link';

const SemanticSeoHero = () => {
    return (

        <div className="bg-[#f3ebfb] ">
            <section className="relative w-full min-h-[65vh] flex flex-col items-center justify-center text-center px-4 py-16 overflow-hidden bg-white rounded-b-[120px]">

                {/* ১. ডট গ্রিড ব্যাকগ্রাউন্ড (Dot Grid Background Effect) */}
                <div
                    className="absolute inset-0 z-0 opacity-[0.35]"
                // style={{
                //   backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
                //   backgroundSize: '24px 24px',
                // }}
                />

                {/* কনটেন্ট এরিয়া (ব্যাকগ্রাউন্ডের উপরে রাখার জন্য z-10) */}
                <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">

                    {/* ২. উপরের ছোট ব্যাজ (New: SEO Cluster Template) */}
                    <div className="inline-flex items-center gap-2 bg-white border border-gray-200/80 rounded-lg px-3 py-1.5 shadow-sm text-sm font-medium text-gray-800 mb-8 backdrop-blur-sm">
                        <span className="bg-[#EAF5FF] text-[#1E88E5] text-xs font-bold px-2 py-0.5 rounded border border-[#D0E7FF]">
                            New
                        </span>
                        <span className="text-gray-700 font-normal">SEO Cluster Template</span>
                    </div>

                    {/* ৩. মেইন হেডিং (Semantic SEO Services শব্দগুচ্ছ অরেঞ্জ কালার হাইলাইটেড) */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.2] max-w-4xl mb-6">
                        Rank with Relevance Using Our <br />
                        <span className="text-[#E05305] block mt-2">Semantic SEO Services</span>
                    </h1>

                    {/* ৪. সাব-হেডিং / বিবরণ (Description) */}
                    <p className="text-gray-600 text-sm md:text-base lg:text-lg max-w-4xl leading-relaxed mb-10 font-normal">
                        At Saffron Edge, we specialize in Semantic SEO services that help your content align with how people
                        actually search, and how search engines actually understand. We don't just optimize pages, we build
                        meaning into your entire site.
                    </p>

                    {/* ৫. ছোট মিডল টেক্সট (Get a predictable pipeline.) */}
                    <p className="text-gray-800 text-base md:text-lg font-medium mb-4">
                        Get a predictable pipeline.
                    </p>

                    {/* ৬. কল-টু-অ্যাকশন বাটনসমূহ (CTA Buttons with 3D shadow style) */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center mb-12 w-full sm:w-auto">
                        {/* Book Strategy Call Button */}
                        <Link
                            href="/book-call"
                            className="w-full sm:w-auto bg-[#E05305] text-white font-extrabold px-8 py-3.5 rounded-lg shadow-md hover:bg-[#c84a04] transition-all text-center min-w-[200px]"
                        >
                            Book Strategy Call
                        </Link>

                        {/* Case Studies Button */}
                        <Link
                            href="/case-studies"
                            className="w-full sm:w-auto bg-white text-[#E05305] border border-[#E05305] font-extrabold px-8 py-3.5 rounded-lg shadow-[0_4px_0_0_#c84a04] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#c84a04] active:translate-y-[4px] active:shadow-none transition-all text-center min-w-[200px]"
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

                {/* নিচে দুই কোণার হালকা বক্রাকার কার্ভ শেড সিমুলেশন */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50/20 to-transparent pointer-events-none" />
            </section>
        </div>

    );
};

export default SemanticSeoHero;