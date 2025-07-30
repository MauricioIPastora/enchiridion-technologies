import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 to-black" />
      <div className="container mx-auto px-4 lg:px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-orange-900/30 text-orange-300 border-orange-700">
            Ancient Knowledge, Modern Solutions
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-600 bg-clip-text text-transparent pb-4">
            Enchiridion Technologies
          </h1>
          <p className="text-xl md:text-2xl text-orange-200 mb-8 leading-relaxed relative z-10">
            We craft digital experiences with the precision of ancient scribes and the innovation of modern technology.
            Specializing in UI/UX design, dashboards, reporting, and custom software solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8">
              <Link href="#contact" className="flex items-center">
                Begin Your Journey <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white bg-transparent"
            >
              <Link href="#projects">View Our Work</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
