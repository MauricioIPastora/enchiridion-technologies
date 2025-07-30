import { ServiceCard } from "./service-card"
import { servicesData } from "../data/services-data"

export function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-gradient-to-b from-black to-orange-950/20">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-orange-300">Our Sacred Arts</h2>
          <p className="text-xl text-orange-200 max-w-2xl mx-auto">
            Each service we offer is crafted with meticulous attention to detail, combining ancient principles of design
            with cutting-edge technology.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesData.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  )
}
