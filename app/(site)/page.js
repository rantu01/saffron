import Image from "next/image";
import Hero from "../Component/Home/Hero";
import TrustedBy from "../Component/Home/TrustedBy";
import FunnelSwitcher from "../Component/Home/FunnelSwitcher";
import ServicesShowcase from "../Component/Home/ServicesShowcase";
import StatsShowcase from "../Component/Home/StatsShowcase";
import IndustryShowcase from "../Component/Home/IndustryShowcase";
import FeaturesGrid from "../Component/Home/FeaturesGrid";
import BotModelShowcase from "../Component/Home/BotModelShowcase";
import CaseStudiesGrid from "../Component/Home/CaseStudiesGrid";
import BlogsGrid from "../Component/Home/BlogsGrid";
import TestimonialsSlider from "../Component/Home/TestimonialsSlider";
import ContactSection from "../Component/Home/ContactSection";

export default function Home() {
  return (
    <div className="">
      <Hero></Hero>
      <TrustedBy></TrustedBy>
      <FunnelSwitcher></FunnelSwitcher>
      <ServicesShowcase></ServicesShowcase>
      <StatsShowcase></StatsShowcase>
      <IndustryShowcase></IndustryShowcase>
      <FeaturesGrid></FeaturesGrid>
      <BotModelShowcase></BotModelShowcase>
      <CaseStudiesGrid></CaseStudiesGrid>
      <BlogsGrid></BlogsGrid>
      <TestimonialsSlider></TestimonialsSlider>
      <ContactSection></ContactSection>
    </div>
  );
}
