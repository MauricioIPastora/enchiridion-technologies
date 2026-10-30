import HeroSection from "@/features/home/hero-section";
import ResumeSection from "@/features/home/resume-section";
import SelectedWorksSection from "@/features/home/selected-works-section";
import ServicesSection from "@/features/home/services-section";
import ServicesSectionMobile from "@/features/home/services-section-mobile";
import ProcessSection from "@/features/home/process-section";
import ProcessSectionMobile from "@/features/home/process-section-mobile";
import GetInTouchSection from "@/features/home/get-in-touch-section";
import Footer from "@/features/home/footer";

export default function HomePage() {
  return (
    <main data-page-content className="container relative z-10">
      <HeroSection />
      <ResumeSection />
      <SelectedWorksSection />
      <ServicesSection />
      <ServicesSectionMobile />
      <div data-dissolve="out" data-dissolve-start="top 150%" data-dissolve-end="top top">
        <ProcessSection />
        <ProcessSectionMobile />
      </div>
      <GetInTouchSection />
      <Footer />
    </main>
  );
}
