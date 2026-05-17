import BlogsGrid from "@/app/Component/Home/BlogsGrid";
import ContactSection from "@/app/Component/Home/ContactSection";
import BlogsGrid2 from "@/app/Component/services/BlogsGrid2";
import ClientTestimonialCTA from "@/app/Component/services/ClientTestimonialCTA";
import GrowthHero from "@/app/Component/services/GrowthHero";
import PartnerLogos from "@/app/Component/services/PartnerLogos";
import FaqAccordion from "@/app/Component/services/serviceDetails/FaqAccordion";
import ServicesAccordion from "@/app/Component/services/ServicesAccordion";

export default function Page() {
  return (
    <div className="">
      <GrowthHero></GrowthHero>
      <PartnerLogos></PartnerLogos>
      <ServicesAccordion></ServicesAccordion>
      <BlogsGrid2></BlogsGrid2>
      <ClientTestimonialCTA></ClientTestimonialCTA>
    </div>
  );
}