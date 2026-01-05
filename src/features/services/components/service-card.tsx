"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { GlassmorphicCard } from "@/components/glassmorphic-card"

interface ServiceCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function ServiceCard({ icon: Icon, title, description }: ServiceCardProps) {
  return (
    <GlassmorphicCard>
      <div className="space-y-4">
        <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center group-hover:bg-orange-600/30 transition-colors">
          <Icon className="h-6 w-6 text-orange-400" />
        </div>
        <h3 className="text-xl font-semibold text-orange-300">{title}</h3>
        <p className="text-orange-200">{description}</p>
      </div>
    </GlassmorphicCard>
  )
}
