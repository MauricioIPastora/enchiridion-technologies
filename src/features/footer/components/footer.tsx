import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-orange-900/20 py-12 bg-black">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <BookOpen className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-semibold text-orange-300">Enchiridion Technologies</span>
          </div>
          <p className="text-orange-400 text-sm">
            © {new Date().getFullYear()} Enchiridion Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
