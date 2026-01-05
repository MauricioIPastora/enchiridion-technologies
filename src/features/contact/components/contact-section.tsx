"use client"

import { ContactInfo } from "./contact-info"
import { ContactForm } from "./contact-form"
import { SectionHeading } from "@/components/section-heading"

export function ContactSection() {
  return (
    <section id="contact" className="py-32 relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-orange-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <SectionHeading title="Begin Your Digital Transformation" subtitle="Ready to turn your vision into reality? Let's discuss your project" />

          <div className="grid md:grid-cols-2 gap-12 mt-16">
            <ContactInfo />
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}
