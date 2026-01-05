"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { ScrollText } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { GlassmorphicCard } from "@/components/glassmorphic-card"

export function AboutSection() {
  return (
    <section id="about" className="py-32 relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-orange-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <SectionHeading title="The Scribes Behind the Code" subtitle="We are digital alchemists, transforming ideas into powerful software solutions" />

          <div className="grid md:grid-cols-2 gap-12 items-center mt-16">
            <GlassmorphicCard>
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
            </GlassmorphicCard>
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 blur-xl opacity-70"></div>
              <div className="relative aspect-square bg-gradient-to-br from-orange-900/30 to-black rounded-lg flex items-center justify-center border border-orange-800/50">
                <ScrollText className="h-32 w-32 text-orange-500/60" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-orange-600/10 rounded-lg" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
