import { Badge } from "@/components/ui/badge"
import { ScrollText } from "lucide-react"

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-gradient-to-b from-orange-950/10 to-black">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-orange-300">The Scribes Behind the Code</h2>
            <p className="text-xl text-orange-200">
              We are digital alchemists, transforming ideas into powerful software solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-orange-300 mb-6">Our Philosophy</h3>
              <p className="text-orange-200 mb-6 leading-relaxed">
                Like the ancient Enchiridion - a handbook of knowledge - we believe in distilling complex
                technical challenges into elegant, practical solutions. Our approach combines time-tested principles
                with innovative technologies.
              </p>
              <p className="text-orange-200 mb-6 leading-relaxed">
                Every project we undertake is treated as a sacred text, carefully crafted with attention to detail,
                scalability, and user experience. We don&apos;t just write code; we architect digital experiences that stand
                the test of time.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-orange-900/30 text-orange-300 border-orange-700">Ancient Knowledge</Badge>
                <Badge className="bg-orange-900/30 text-orange-300 border-orange-700">Modern Solutions</Badge>
                <Badge className="bg-orange-900/30 text-orange-300 border-orange-700">100% Client Satisfaction</Badge>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-orange-900/30 to-black rounded-lg flex items-center justify-center">
                <ScrollText className="h-32 w-32 text-orange-500/60" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-orange-600/10 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
