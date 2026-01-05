"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import Image from "next/image"

interface ProjectCardProps {
  title: string
  description: string
  category: string
  imageUrl: string
  imageAlt: string
}

export function ProjectCard({
  title,
  description,
  category,
  imageUrl,
  imageAlt,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="group"
    >
      <div
        className="relative h-full overflow-hidden rounded-xl bg-black/50 backdrop-blur-sm border border-orange-800/50 transition-all duration-300 group-hover:border-orange-500/50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

        <div className="relative h-full flex flex-col">
          <div className="relative overflow-hidden h-48">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-600/20 to-orange-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={imageAlt}
              width={600}
              height={400}
              className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"}`}
            />
          </div>

          <div className="p-6 flex-grow">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-orange-400 fill-current" />
              <Badge
                variant="secondary"
                className="bg-orange-900/50 text-orange-300 border-orange-800/50"
              >
                {category}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-orange-300 mb-2">{title}</h3>
            <p className="text-orange-200 text-sm">{description}</p>
          </div>

          <div className="absolute top-3 right-3 z-20">
            <div
              className={`w-3 h-3 rounded-full ${isHovered ? "bg-orange-500" : "bg-orange-800/50"} transition-colors duration-300`}
            ></div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
