import { ProjectCard } from "./project-card"
import { projectsData } from "../data/projects-data"

export function ProjectsSection() {
  return (
    <section id="projects" className="py-20 bg-black">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-orange-300">Featured Grimoires</h2>
          <p className="text-xl text-orange-200 max-w-2xl mx-auto">
            Explore our collection of digital masterpieces, each one a testament to our craft and dedication.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectsData.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
      </div>
    </section>
  )
}
