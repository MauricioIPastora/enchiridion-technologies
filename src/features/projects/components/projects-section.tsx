"use client"

import { ProjectCard } from "./project-card";
import { projectsData } from "../data/projects-data";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Code, Database, Globe } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

export function ProjectsSection() {
  // Calculate how many placeholder cards we need to fill the grid
  const totalSlots = 3; // Show 3 total cards
  const placeholderCount = totalSlots - projectsData.length;

  return (
    <section id="projects" className="py-32 relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <SectionHeading title="Featured Projects" subtitle="Explore our collection of digital masterpieces" />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {/* Show existing projects */}
          {projectsData.length > 0 &&
            projectsData.map((project) => (
              <ProjectCard key={project.title} {...project} />
            ))}

          {/* Show Coming Soon placeholders */}
          {Array.from({ length: placeholderCount }).map((_, index) => (
            <ComingSoon
              key={`placeholder-${index}`}
              variant="card"
              title="New Project Coming Soon"
              description="We're working on something amazing. Stay tuned for updates!"
              icon={
                index % 3 === 0 ? (
                  <Code className="h-6 w-6" />
                ) : index % 3 === 1 ? (
                  <Database className="h-6 w-6" />
                ) : (
                  <Globe className="h-6 w-6" />
                )
              }
              className="bg-black/50 border-orange-800/30 text-orange-200"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
