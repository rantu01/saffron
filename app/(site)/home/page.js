import Image from "next/image";
import dynamic from "next/dynamic";
import Hero from "../../Component/Home/Hero";
import TrustedBy from "../../Component/Home/TrustedBy";
import FunnelSwitcher from "../../Component/Home/FunnelSwitcher";
import ServicesShowcase from "../../Component/Home/ServicesShowcase";
import StatsShowcase from "../../Component/Home/StatsShowcase";

const IndustryShowcase = dynamic(() => import("../../Component/Home/IndustryShowcase"), { ssr: true });
const FeaturesGrid = dynamic(() => import("../../Component/Home/FeaturesGrid"), { ssr: true });
const BotModelShowcase = dynamic(() => import("../../Component/Home/BotModelShowcase"), { ssr: true });
const CaseStudiesGrid = dynamic(() => import("../../Component/Home/CaseStudiesGrid"), { ssr: true });
const BlogsGrid = dynamic(() => import("../../Component/Home/BlogsGrid"), { ssr: true });
const TestimonialsSlider = dynamic(() => import("../../Component/Home/TestimonialsSlider"), { ssr: true });
const ContactSection = dynamic(() => import("../../Component/Home/ContactSection"), { ssr: true });

export default function HomePage() {
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
