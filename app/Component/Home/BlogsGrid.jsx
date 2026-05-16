import React from 'react';
import Link from 'next/link';

const BlogsGrid = () => {
  // ৩টি ব্লগের ডেটা অবজেক্ট অ্যারে
  const blogsData = [
    {
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop", // ফোন ও নোটিফিকেশন রিলেটেড ডামি ইমেজ
      tag: "Marketing Automation",
      readTime: "8 min read",
      title: "What is a Lead Nurturing Workflow? An Effective Guide t...",
      author: "Sabah Noor"
    },
    {
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=600&auto=format&fit=crop", // ড্যাশবোর্ড/হাবস্পট রিলেটেড ডামি ইমেজ
      tag: "Marketing Automation",
      readTime: "7 min read",
      title: "How HubSpot Workflow Automation Can Improve...",
      author: "Sabah Noor"
    },
    {
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop", // ল্যাপটপ ও এসইও ওয়ার্ক ইমেজ
      tag: "Voice Search Optimization",
      readTime: "9 min read",
      title: "What is SEO? 2025 Guide to Search Optimization in the AI Era",
      author: "Nishant Ahlawat"
    }
  ];

  return (
    <section className="w-full bg-white py-16 px-4 md:px-8 max-w-7xl mx-auto font-sans">
      
      {/* ১. সেকশনের উপরের মেইন হেডার */}
      <div className="w-full text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-3 tracking-tight">
          Blogs
        </h2>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto font-normal leading-relaxed">
          We explore and publish the latest & most underrated content before it becomes a trend.
        </p>
      </div>

      {/* ২. ব্লগ কার্ডসমূহের ৩-কলামের গ্রিড লেআউট */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {blogsData.map((blog, idx) => (
          <div 
            key={idx} 
            className="w-full border border-gray-100 rounded-2xl p-4 bg-white shadow-xs flex flex-col h-full min-h-[430px] hover:shadow-md transition-shadow duration-300 group cursor-pointer"
          >
            {/* কার্ডের ইমেজ এরিয়া */}
            <div className="w-full h-52 rounded-xl overflow-hidden mb-5 relative bg-gray-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={blog.image} 
                alt={blog.title} 
                className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-300"
              />
              {/* ছবির ওপরের ওয়াটারমার্ক লোগো ইফেক্ট (ঐচ্ছিক) */}
              <div className="absolute top-4 left-4 text-white text-xs font-bold tracking-tight opacity-80">
                saffron<span className="text-sky-400">edge</span>
              </div>
            </div>

            {/* ট্যাগ এবং রিড টাইম রো */}
            <div className="flex items-center justify-between mb-4 w-full">
              {/* লাইট ব্লু ক্যাটাগরি ট্যাগ ব্যাজ */}
              <span className="bg-[#E4F3FF] text-[#2996E6] text-[11px] font-bold px-2.5 py-1.5 rounded-md tracking-wide">
                {blog.tag}
              </span>
              {/* রিড টাইম */}
              <span className="text-gray-400 text-xs font-medium">
                {blog.readTime}
              </span>
            </div>

            {/* ব্লগ টাইটেল এবং লেখক */}
            <div className="flex-1 flex flex-col justify-between">
              <h3 className="text-gray-950 font-extrabold text-base md:text-[17px] leading-snug tracking-tight group-hover:text-[#E05305] transition-colors duration-200 mb-4">
                {blog.title}
              </h3>
              
              {/* লেখক সেকশন */}
              <span className="text-gray-400 text-xs font-medium block">
                By {blog.author}
              </span>
            </div>

          </div>
        ))}
      </div>

      {/* ৩. নিচের "Explore More Blogs" বাটন */}
      <div className="w-full flex justify-center">
        <Link 
          href="/blogs"
          className="bg-white text-[#E05305] border border-[#E05305] font-bold text-sm md:text-base px-8 py-3 rounded-lg shadow-[0_4px_0_0_#c84a04] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#c84a04] active:translate-y-[4px] active:shadow-none transition-all text-center min-w-[200px]"
        >
          Explore More Blogs
        </Link>
      </div>

    </section>
  );
};

export default BlogsGrid;