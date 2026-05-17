import React from 'react';
import services from '../../../Component/services/servicesData';
import Link from 'next/link';
import SemanticSeoHero from '@/app/Component/services/serviceDetails/SemanticSeoHero';
import SeoExpectedResults from '@/app/Component/services/serviceDetails/SeoExpectedResults';
import AgencyFeatures from '@/app/Component/services/serviceDetails/AgencyFeatures';
import SeoTruthsShowcase from '@/app/Component/services/serviceDetails/SeoTruthsShowcase';
import ServicesShowcase2 from '@/app/Component/services/serviceDetails/ServicesShowcase2';
import TrustedBy from '@/app/Component/Home/TrustedBy';
import SeoProcessTimeline from '@/app/Component/services/serviceDetails/SeoProcessTimeline';
import TechStackGrid from '@/app/Component/services/serviceDetails/TechStackGrid';
import WhyChooseUsGrid from '@/app/Component/services/serviceDetails/WhyChooseUsGrid';
import BlogsGrid from '@/app/Component/Home/BlogsGrid';
import CaseStudiesGrid from '@/app/Component/Home/CaseStudiesGrid';
import Testimonials from '@/app/Component/Home/TestimonialsSlider';
import FaqAccordion from '@/app/Component/services/serviceDetails/FaqAccordion';
import ContactSection from '@/app/Component/Home/ContactSection';

const ServicePage = async ({ params }) => {
  const { slug } = await params;

  const slugify = (str) =>
    String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const target = String(slug || '').toLowerCase();

  const service = services.find((s) => {
    if (!s || !s.slug) return false;
    if (s.slug === target) return true;
    if (slugify(s.title) === target) return true;
    return false;
  });

  if (!service) {
    return (
      <div className="w-full max-w-4xl mx-auto py-24 px-6">
        <h2 className="text-2xl font-extrabold mb-4">Service not found</h2>
        <p className="text-gray-500 mb-6">We couldn't find the service you're looking for.</p>
        <Link href="/services" className="text-[#E05305] font-bold">Back to services</Link>
      </div>
    );
  }

  return (
    <main className="">
      <SemanticSeoHero></SemanticSeoHero>
      <SeoExpectedResults></SeoExpectedResults>
      <AgencyFeatures></AgencyFeatures>
      <SeoTruthsShowcase></SeoTruthsShowcase>
      <ServicesShowcase2></ServicesShowcase2>
      <TrustedBy></TrustedBy>
      <SeoProcessTimeline></SeoProcessTimeline>
      <TechStackGrid></TechStackGrid>
      <WhyChooseUsGrid></WhyChooseUsGrid>
      <BlogsGrid></BlogsGrid>
      <CaseStudiesGrid></CaseStudiesGrid>
      <Testimonials></Testimonials>
      <FaqAccordion></FaqAccordion>
      <ContactSection></ContactSection>
    </main>
  );
};

export default ServicePage;
