import React from 'react';

const LatestCaseStudies = () => {
    // ডানদিকের ছোট ৩টি কার্ডের ডেটা অবজেক্ট অ্যারে
    const smallCardsData = [
        {
            image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=300&auto=format&fit=crop", // ক্লিনিক বা অ্যাপয়েন্টমেন্ট রিলেটেড ডামি ইমেজ
            tag: "SEO Marketing",
            title: "How We Grew Booked Appointments 4.3x in 11 Months fo..."
        },
        {
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=300&auto=format&fit=crop", // রেভিনিউ ইঞ্জিন/চার্ট রিলেটেড ডামি ইমেজ
            tag: "SEO",
            title: "We Built a $350K/Month Revenue Engine from Scratch for a Wealth..."
        },
        {
            image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=300&auto=format&fit=crop", // ইভেন্টস/টিম মিটিং রিলেটেড ডামি ইমেজ
            tag: "SEO",
            title: "$5M in 5 Months for Events Management Company | A GTM..."
        }
    ];

    return (

        <div className="w-full bg-[#E3F2FD]  flex items-center  font-sans">



            <section className="w-full bg-white py-16 px-4 md:px-8  font-sans rounded-t-[120px] ">


                <div className="max-w-7xl mx-auto px-4">
                    {/* ১. সেকশনের টাইটেল বা হেডার */}
                    <div className="w-full text-left mb-8">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-950 tracking-tight">
                            Latest Case Studies
                        </h2>
                    </div>

                    {/* ২. অসমান ২-কলাম লেআউট গ্রিড */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* বাম দিকের কলাম: বড় মূল ফিচার্ড কার্ড (৫ স্প্যান) */}
                        <div className="lg:col-span-5 border border-gray-100 rounded-2xl p-4 bg-white shadow-xs flex flex-col h-full justify-between min-h-[500px]">
                            <div className="w-full h-72 rounded-xl overflow-hidden mb-5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=600&auto=format&fit=crop" // টিম হ্যান্ডশেক ডামি ইমেজ
                                    alt="Featured Case Study"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                {/* লাইট ব্লু 'Others' ট্যাগ */}
                                <div className="mb-3.5">
                                    <span className="bg-[#E4F3FF] text-[#2996E6] text-xs font-bold px-2.5 py-1.5 rounded-md tracking-wide">
                                        Others
                                    </span>
                                </div>
                                {/* বোল্ড টাইটেল */}
                                <h3 className="text-gray-950 font-extrabold text-lg md:text-[21px] leading-snug tracking-tight">
                                    A 49% Hike In Organic Traffic For A Recruitment Service Company
                                </h3>
                            </div>
                        </div>

                        {/* ডান দিকের কলাম: ৩টি ছোট কার্ডের রো কন্টেইনার (৭ স্প্যান) */}
                        <div className="lg:col-span-7 flex flex-col gap-4 w-full">
                            {smallCardsData.map((card, idx) => (
                                <div
                                    key={idx}
                                    className="w-full border border-gray-100 rounded-xl p-3 bg-white shadow-xs flex items-center gap-4 min-h-[145px] hover:shadow-sm transition-shadow duration-200 cursor-pointer"
                                >
                                    {/* ছোট কার্ডের ইমেজ থাম্বনেইল */}
                                    <div className="w-36 md:w-44 h-28 rounded-lg overflow-hidden flex-shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={card.image}
                                            alt={card.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* ছোট কার্ডের টেক্সট এরিয়া */}
                                    <div className="flex flex-col items-start gap-2">
                                        {/* ডাইনামিক লাইট ব্লু ট্যাগ */}
                                        <span className="bg-[#E4F3FF] text-[#2996E6] text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-md tracking-wide">
                                            {card.tag}
                                        </span>
                                        {/* ট্রাঙ্কেটেড টাইটেল */}
                                        <h4 className="text-gray-950 font-extrabold text-sm md:text-base leading-snug tracking-tight">
                                            {card.title}
                                        </h4>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>


            </section>
        </div>

    );
};

export default LatestCaseStudies;