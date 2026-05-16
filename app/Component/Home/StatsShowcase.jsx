import React from 'react';

const StatsShowcase = () => {
  // প্রতিটি স্ট্যাটসের কালার এবং ডেটা ডাইনামিক রাখার জন্য অবজেক্ট অ্যারে
  const statsData = [
    {
      value: "18+",
      label: "Years of expertise",
      textColor: "text-[#E05305]" // কমোলা রঙের টোন
    },
    {
      value: "150+",
      label: "Growth Experts",
      textColor: "text-[#936DFF]" // বেগুনি (Purple) রঙের টোন
    },
    {
      value: "3X",
      label: "ROI in < 6 months",
      textColor: "text-[#29A0FF]" // হালকা নীল রঙের টোন
    },
    {
      value: "2,500+",
      label: "Client Stories",
      textColor: "text-[#5B73FF]" // গাঢ় রয়্যাল ব্লু টোন
    }
  ];

  return (
    <section className="w-full bg-[#f3ebfb] py-16 px-6 text-center font-sans">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* ১. সেকশনের উপরের মেইন হেডিং */}
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-950 mb-12 tracking-tight">
          Turning clicks to loyal customers since 2008
        </h2>

        {/* ২. স্ট্যাটস কাউন্টারসমূহের ৪-কলামের গ্রিড লেআউট */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4 justify-center items-center">
          {statsData.map((stat, index) => (
            <div key={index} className="flex flex-col items-center justify-center">
              
              {/* বড় নাম্বার / মেট্রিক */}
              <span className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-3 ${stat.textColor}`}>
                {stat.value}
              </span>
              
              {/* নিচের লেবেল বা বিবরণ */}
              <p className="text-gray-600 text-sm md:text-base font-medium whitespace-nowrap">
                {stat.label}
              </p>
              
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default StatsShowcase;