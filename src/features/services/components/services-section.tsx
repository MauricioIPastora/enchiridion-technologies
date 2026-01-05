"use client"

import { ServiceCard } from "./service-card"
import { servicesData } from "../data/services-data"
import { SectionHeading } from "@/components/section-heading"

export function ServicesSection() {
  return (
    <section id="services" className="py-32 relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-orange-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <SectionHeading title="Our Sacred Arts" subtitle="Meticulous attention to detail, combining ancient principles with cutting-edge technology" />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {servicesData.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  )
}
