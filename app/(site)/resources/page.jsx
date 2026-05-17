import { Suspense } from "react";
import ContactSection from "@/app/Component/Home/ContactSection";
import ResourcesArchive from "@/app/Component/resources/ResourcesArchive";
import ResourcesShowcase from "@/app/Component/resources/ResourcesShowcase";


export default function Page() {
  return (
    <div className="">
      <ResourcesShowcase></ResourcesShowcase>
      <Suspense fallback={null}>
        <ResourcesArchive></ResourcesArchive>
      </Suspense>
      <ContactSection></ContactSection>
    </div>
  );
}