import { ProjectCard } from "./project-card";
import { projectsData } from "../data/projects-data";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Code, Database, Globe } from "lucide-react";

export function ProjectsSection() {
  // Calculate how many placeholder cards we need to fill the grid
  const totalSlots = 3; // Show 3 total cards
  const placeholderCount = totalSlots - projectsData.length;

  return (
    <section id="projects" className="py-20 bg-black">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-orange-300">
            Featured Grimoires
          </h2>
          <p className="text-xl text-orange-200 max-w-2xl mx-auto">
            Explore our collection of digital masterpieces, each one a testament
            to our craft and dedication.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              className="bg-orange-950/20 border-orange-800/30 text-orange-200"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
