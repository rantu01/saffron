import LatestCaseStudies from '@/app/Component/case-study/LatestCaseStudies';
import DigitalExperiencesHero from '../../Component/case-study/DigitalExperiencesHero';
import CaseStudiesArchive from '@/app/Component/case-study/CaseStudiesArchive';
import ContactSection from '@/app/Component/Home/ContactSection';

export default function Page() {
  return (
    <div className="">
      <DigitalExperiencesHero />
      <LatestCaseStudies></LatestCaseStudies>
      <CaseStudiesArchive></CaseStudiesArchive>
      <ContactSection></ContactSection>
    </div>
  );
}