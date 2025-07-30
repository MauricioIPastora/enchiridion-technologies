import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import Image from "next/image";

interface ProjectCardProps {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  imageAlt: string;
}

export function ProjectCard({
  title,
  description,
  category,
  imageUrl,
  imageAlt,
}: ProjectCardProps) {
  return (
    <Card className="bg-orange-950/20 border-orange-800/30 overflow-hidden group hover:border-orange-600/50 transition-all duration-300">
      <div className="aspect-video bg-gradient-to-br from-orange-900/40 to-black relative overflow-hidden">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={imageAlt}
          width={350}
          height={200}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-4 w-4 text-orange-400 fill-current" />
          <Badge
            variant="secondary"
            className="bg-orange-900/50 text-orange-300"
          >
            {category}
          </Badge>
        </div>
        <h3 className="text-lg font-semibold text-orange-300 mb-2">{title}</h3>
        <p className="text-orange-200 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
