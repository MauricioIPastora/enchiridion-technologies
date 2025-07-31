import { ContactInfo } from "./contact-info"
import { ContactForm } from "./contact-form"

export function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-black">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-orange-300">Begin Your Digital Transformation</h2>
            <p className="text-xl text-orange-200">
              Ready to turn your vision into reality? Let&apos;s discuss your project.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <ContactInfo />
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}
