"use client"

import { Button } from "@/components/ui/button"
import { GlassmorphicCard } from "@/components/glassmorphic-card"

export function ContactForm() {

  return (
    <GlassmorphicCard>
      <h3 className="text-2xl font-semibold text-orange-300 mb-2">Start Your Project</h3>
      <p className="text-orange-200 mb-6">
        Tell us about your vision and we&apos;ll help bring it to life.
      </p>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-orange-300 mb-2 block">Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 bg-black/50 border border-orange-800/50 rounded-md text-orange-100 focus:border-orange-600 focus:outline-none"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-orange-300 mb-2 block">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 bg-black/50 border border-orange-800/50 rounded-md text-orange-100 focus:border-orange-600 focus:outline-none"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-orange-300 mb-2 block">Project Type</label>
          <select className="w-full px-3 py-2 bg-black/50 border border-orange-800/50 rounded-md text-orange-100 focus:border-orange-600 focus:outline-none">
            <option>UI/UX Design</option>
            <option>Dashboard & Reporting</option>
            <option>Custom Software</option>
            <option>Full Stack Development</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-orange-300 mb-2 block">Message</label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 bg-black/50 border border-orange-800/50 rounded-md text-orange-100 focus:border-orange-600 focus:outline-none resize-none"
            placeholder="Tell us about your project..."
          />
        </div>
        <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-600 border-0 text-white">Send Message</Button>
      </div>
    </GlassmorphicCard>
  )
}
