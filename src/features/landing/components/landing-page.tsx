"use client";

import { useEffect, useState } from "react";
import { Header } from "@/features/navigation/components/header";
import HeroSection from "@/features/hero/components/hero-section";
import { ServicesSection } from "@/features/services/components/services-section";
import { ProjectsSection } from "@/features/projects/components/projects-section";
import { AboutSection } from "@/features/about/components/about-section";
import { ContactSection } from "@/features/contact/components/contact-section";
import { Footer } from "@/features/footer/components/footer";
import { ScrollProgress } from "@/components/scroll-progress";
// import { MouseFollower } from "@/components/mouse-follower";
import MatrixRain from "@/components/matrix-rain";

export function LandingPage() {
  const [matrixOpacity, setMatrixOpacity] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const projectsSection = document.getElementById("services");
      if (!projectsSection) return;

      const projectsTop = projectsSection.offsetTop;
      const scrollY = window.scrollY;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      // Only start showing matrix after reaching projects section
      if (scrollY < projectsTop) {
        setMatrixOpacity(0);
        return;
      }

      // Calculate progress from projects section to bottom of page
      const scrollableAfterProjects = documentHeight - projectsTop;
      const scrolledPastProjects = scrollY - projectsTop;
      const progress = Math.min(
        scrolledPastProjects / scrollableAfterProjects,
        1
      );

      // Smooth easing for opacity
      const opacity = Math.pow(progress, 0.7); // Slightly faster ramp-up
      setMatrixOpacity(opacity);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-orange-50 overflow-hidden">
      {matrixOpacity > 0 && (
        <MatrixRain
          className="fixed inset-0 z-0"
          fontSize={16}
          color="#fb923c"
          speed={0.6}
          opacity={matrixOpacity}
        />
      )}
      {/* <MouseFollower /> */}
      <ScrollProgress />
      <Header />
      <HeroSection />
      <ServicesSection />
      <ProjectsSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
