import * as React from "react"
import { Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

interface ComingSoonProps {
  title?: string
  description?: string
  variant?: "default" | "compact" | "card"
  className?: string
  icon?: React.ReactNode
}

export function ComingSoon({
  title = "Coming Soon!",
  description = "We're working hard to bring you amazing content. Stay tuned!",
  variant = "default",
  className,
  icon,
}: ComingSoonProps) {
  const defaultIcon = <Clock className="h-6 w-6" />
  const IconComponent = icon || defaultIcon

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/25 p-6 text-center",
          className
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          {IconComponent}
          <span className="font-medium">{title}</span>
        </div>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <Card className={cn("text-center", className)}>
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {IconComponent}
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
          <div className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Something amazing is brewing</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/25 p-8 text-center",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        {IconComponent}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-md">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Something amazing is brewing</span>
      </div>
    </div>
  )
} 