import Link from "next/link"
import Image from "next/image"

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-3 group">
      <div className="relative">
        {/* Custom scroll logo */}
        <div className="relative w-8 h-8 transition-transform duration-300 group-hover:scale-110">
          <Image
            src="/scroll-image.png"
            alt="Enchiridion Technologies Logo"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
          {/* Mystical glow effect */}
          <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        {/* Animated mystical dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full opacity-60 animate-pulse shadow-lg shadow-orange-500/50" />
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent group-hover:from-orange-300 group-hover:to-orange-500 transition-all duration-300">
        Enchiridion Technologies
      </span>
    </Link>
  )
}

