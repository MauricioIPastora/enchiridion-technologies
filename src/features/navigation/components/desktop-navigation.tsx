import { Button } from "@/components/ui/button"
import Link from "next/link"

export function DesktopNavigation() {
  return (
    <nav className="hidden md:flex items-center space-x-8">
      <Link href="#services" className="text-orange-100 hover:text-orange-400 transition-colors">
        Services
      </Link>
      <Link href="#projects" className="text-orange-100 hover:text-orange-400 transition-colors">
        Featured Projects
      </Link>
      <Link href="#about" className="text-orange-100 hover:text-orange-400 transition-colors">
        About Us
      </Link>
      <Button className="bg-orange-600 hover:bg-orange-700 text-white">
        <Link href="#contact">Contact Us</Link>
      </Button>
    </nav>
  )
}
