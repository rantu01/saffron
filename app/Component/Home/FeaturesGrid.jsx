import React from 'react';
import { TrendingUp, Award, Zap, Users, Lightbulb, BarChart3 } from 'lucide-react';

const FeaturesGrid = () => {
  // ৬টি কার্ডের ভিন্ন ভিন্ন কালার থিম এবং ডেটা অবজেক্ট অ্যারে
  const featuresData = [
    {
      badge: "Dedicated Growth Leader",
      title: "Growth marketing experts",
      desc: "We help you become the #1 choice for your users, as we don't just provide you with a project manager but also a growth marketing leader who works like your team member.",
      icon: <TrendingUp size={22} className="text-white" />,
      iconBg: "bg-[#2996E6]", // নীল আইকন বক্স
      topBg: "bg-[#E4F3FF]",   // হালকা নীল ব্যাকগ্রাউন্ড
    },
    {
      badge: "12+ Industries Served",
      title: "Long-term industrial expertise",
      desc: "We have worked closely with 12+ industries to beat the competition by providing a full-service B2B marketing solution for SaaS, manufacturing, healthcare, finance, agriculture, and more.",
      icon: <Award size={22} className="text-white" />,
      iconBg: "bg-[#D66D26]", // অরেঞ্জ/ব্রাউন আইকন বক্স
      topBg: "bg-[#FFF0E4]",   // হালকা অরেঞ্জ ব্যাকগ্রাউন্ড
    },
    {
      badge: "Quick Wins Strategy",
      title: "Fast analysis to conquer low-hanging fruits",
      desc: "We believe in the power of testing and experimentation. Quicker experiments lead to faster results and get us quick, small wins that lead to long-term growth.",
      icon: <Zap size={22} className="text-white" />,
      iconBg: "bg-[#4B56FF]", // নীল-বেগুনি আইকন বক্স
      topBg: "bg-[#EAEBFF]",   // হালকা ব্লু-পার্পল ব্যাকগ্রাউন্ড
    },
    {
      badge: "Unified Team Approach",
      title: "Sales and marketing union",
      desc: "Our collaborative team of marketing and project leaders partners with your sales team to pinpoint data flow gaps and provide effective solutions for your business.",
      icon: <Users size={22} className="text-white" />,
      iconBg: "bg-[#9A5BFF]", // পার্পল আইকন বক্স
      topBg: "bg-[#F3EAFF]",   // হালকা পার্পল ব্যাকগ্রাউন্ড
    },
    {
      badge: "Dedicated Growth Leader",
      title: "Reverse engineering to build better strategies",
      desc: "From organic to paid marketing, we reverse-engineer everything to implement strategies that are already working.",
      icon: <Lightbulb size={22} className="text-white" />,
      iconBg: "bg-[#D66D26]", // অরেঞ্জ/ব্রাউন আইকন বক্স
      topBg: "bg-[#FFF0E4]",   // হালকা অরেঞ্জ ব্যাকগ্রাউন্ড
    },
    {
      badge: "Complete Analytics Suite",
      title: "Data-driven reporting & analysis",
      desc: "Most brands lack an agency to drive exponential growth and provide tracking, monitoring, and data analysis systems.",
      icon: <BarChart3 size={22} className="text-white" />,
      iconBg: "bg-[#2996E6]", // স্কাই ব্লু আইকন বক্স
      topBg: "bg-[#E4F3FF]",   // হালকা নীল ব্যাকগ্রাউন্ড
    }
  ];

  return (
    <section className="w-full bg-white py-16 px-4 md:px-4 max-w-7xl mx-auto font-sans">
      
      {/* ১. টপ হেডার সেকশন */}
      <div className="w-full text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-4 tracking-tight">
          Everything You Need to Scale Faster
        </h2>
        <p className="text-gray-500 text-sm md:text-base max-w-4xl mx-auto leading-relaxed font-normal">
          Saffron Edge provides comprehensive growth expertise and combines strategy, execution, and consistent optimization to deliver measurable results.
        </p>
      </div>

      {/* ২. ফিচার কার্ডসমূহের ৩-কলামের গ্রিড লেআউট */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuresData.map((card, idx) => (
          <div 
            key={idx} 
            className="w-full border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[440px]"
          >
            {/* কার্ডের উপরের হাফ কালার অংশ */}
            <div className={`p-6 ${card.topBg} flex-1 flex flex-col items-start gap-4`}>
              
              {/* গোলাকার আইকন বক্স */}
              <div className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                {card.icon}
              </div>

              {/* হোয়াইট রাউন্ডেড ছোট ব্যাজ */}
              <span className="bg-white/80 backdrop-blur-sm text-gray-500 text-[11px] font-semibold py-1 px-2.5 rounded-md tracking-wide shadow-2xs border border-white/50">
                {card.badge}
              </span>

              {/* বোল্ড টাইটেল */}
              <h3 className="text-gray-950 font-extrabold text-lg md:text-[20px] leading-tight tracking-tight mt-1">
                {card.title}
              </h3>
            </div>

            {/* কার্ডের নিচের পিউর হোয়াইট অংশ */}
            <div className="p-6 bg-white border-t border-gray-100/30 flex-[1.2] flex items-start">
              <p className="text-gray-500 text-sm md:text-base leading-relaxed font-normal">
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};

export default FeaturesGrid;