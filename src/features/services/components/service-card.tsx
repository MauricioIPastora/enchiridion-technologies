import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface ServiceCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function ServiceCard({ icon: Icon, title, description }: ServiceCardProps) {
  return (
    <Card className="bg-orange-950/30 border-orange-800/50 hover:border-orange-600/50 transition-all duration-300 group">
      <CardHeader>
        <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-600/30 transition-colors">
          <Icon className="h-6 w-6 text-orange-400" />
        </div>
        <CardTitle className="text-orange-300">{title}</CardTitle>
        <CardDescription className="text-orange-200">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
