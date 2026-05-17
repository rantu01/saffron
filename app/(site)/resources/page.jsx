import ContactSection from "@/app/Component/Home/ContactSection";
import ResourcesArchive from "@/app/Component/resources/ResourcesArchive";
import ResourcesShowcase from "@/app/Component/resources/ResourcesShowcase";


export default function Page() {
  return (
    <div className="">
      <ResourcesShowcase></ResourcesShowcase>
      <ResourcesArchive></ResourcesArchive>
      <ContactSection></ContactSection>
    </div>
  );
}