import React from 'react';
import Link from 'next/link';

const CaseStudiesGrid = () => {
  // ৩টি কেস স্টাডির ডেটা অবজেক্ট অ্যারে
  const caseStudies = [
    {
      image: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?q=80&w=600&auto=format&fit=crop", // ডামি এসইও ইমেজ
      tag: "Content Marketing",
      title: "50% Revenue Growth in Multilingual SEO Campaign"
    },
    {
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop", // ল্যাপটপ ও ড্যাশবোর্ড ইমেজ
      tag: "Content Marketing",
      title: "A 100.78% Growth In New Website Users By Using Our Technical SEO And Content..."
    },
    {
      image: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?q=80&w=600&auto=format&fit=crop", // উডেন ব্লক এসইও ইমেজ
      tag: "Content Marketing",
      title: "Uplifting Targeted, Organic Traffic By 51% For an SEO Agency in Houston, Texas"
    }
  ];

  return (
    <section className="w-full bg-white py-16 px-4 md:px-8 max-w-7xl mx-auto font-sans">
      
      {/* ১. সেকশনের উপরের মেইন হেডার */}
      <div className="w-full text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-3 tracking-tight">
          Case Studies
        </h2>
        <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto font-normal">
          We drive exceptional results for every client
        </p>
      </div>

      {/* ২. কেস স্টাডি কার্ডসমূহের ৩-কলামের গ্রিড লেআউট */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {caseStudies.map((item, idx) => (
          <div 
            key={idx} 
            className="w-full border border-gray-100/80 rounded-2xl p-4 bg-white shadow-xs flex flex-col h-full min-h-[400px] hover:shadow-md transition-shadow duration-300 group cursor-pointer"
          >
            {/* কার্ডের ইমেজ এরিয়া */}
            <div className="w-full h-52 rounded-xl overflow-hidden mb-5 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
            </div>

            {/* লাইট ব্লু ক্যাটাগরি ট্যাগ ব্যাজ */}
            <div className="mb-3.5">
              <span className="bg-[#E4F3FF] text-[#2996E6] text-xs font-semibold px-3 py-1.5 rounded-md tracking-wide">
                {item.tag}
              </span>
            </div>

            {/* কেস স্টাডি টাইটেল */}
            <h3 className="text-gray-950 font-extrabold text-base md:text-lg leading-snug tracking-tight group-hover:text-[#E05305] transition-colors duration-200">
              {item.title}
            </h3>
          </div>
        ))}
      </div>

      {/* ৩. নিচের "See All Case Studies" বাটন */}
      <div className="w-full flex justify-center">
        <Link 
          href="/case-studies"
          className="bg-white text-[#E05305] border border-[#E05305] font-bold text-sm md:text-base px-8 py-3 rounded-lg shadow-[0_4px_0_0_#c84a04] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#c84a04] active:translate-y-[4px] active:shadow-none transition-all text-center min-w-[200px]"
        >
          See All Case Studies
        </Link>
      </div>

    </section>
  );
};

export default CaseStudiesGrid;