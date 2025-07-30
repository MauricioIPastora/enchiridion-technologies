import { BookOpen } from "lucide-react"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-3">
      <div className="relative">
        <BookOpen className="h-8 w-8 text-orange-500" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full opacity-60 animate-pulse" />
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
        Enchiridion Technologies
      </span>
    </Link>
  )
}
