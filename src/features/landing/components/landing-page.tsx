"use client"

import { Header } from "@/features/navigation/components/header"
import { HeroSection } from "@/features/hero/components/hero-section"
import { ServicesSection } from "@/features/services/components/services-section"
import { ProjectsSection } from "@/features/projects/components/projects-section"
import { AboutSection } from "@/features/about/components/about-section"
import { ContactSection } from "@/features/contact/components/contact-section"
import { Footer } from "@/features/footer/components/footer"
import { ScrollProgress } from "@/components/scroll-progress"
import { MouseFollower } from "@/components/mouse-follower"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-orange-50 overflow-hidden">
      <MouseFollower />
      <ScrollProgress />
      <Header />
      <HeroSection />
      <ServicesSection />
      <ProjectsSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
