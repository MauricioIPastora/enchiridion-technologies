"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, Cog, Star, Mail, Phone } from "lucide-react"
import Link from "next/link"

interface MobileNavigationProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function MobileNavigation({ isOpen, onToggle, onClose }: MobileNavigationProps) {
  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        className="md:hidden text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 p-2"
        onClick={onToggle}
        aria-label="Toggle mobile menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span
            className={`bg-orange-400 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
              isOpen ? "rotate-45 translate-y-1" : "-translate-y-0.5"
            }`}
          />
          <span
            className={`bg-orange-400 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${
              isOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`bg-orange-400 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
              isOpen ? "-rotate-45 -translate-y-1" : "translate-y-0.5"
            }`}
          />
        </div>
      </Button>

      {/* Mobile Navigation Overlay */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Mobile Navigation Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-orange-950/95 to-black/95 backdrop-blur-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile menu header */}
          <div className="flex items-center justify-between p-6 border-b border-orange-800/30">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <BookOpen className="h-6 w-6 text-orange-500" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full opacity-60 animate-pulse" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Enchiridion
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
              onClick={onClose}
              aria-label="Close mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Mobile menu content */}
          <nav className="flex-1 px-6 py-8">
            <div className="space-y-6">
              <Link
                href="#services"
                className="block text-xl text-orange-100 hover:text-orange-400 transition-colors py-3 border-b border-orange-900/20"
                onClick={onClose}
              >
                <div className="flex items-center space-x-3">
                  <Cog className="h-5 w-5 text-orange-500" />
                  <span>Services</span>
                </div>
              </Link>
              <Link
                href="#projects"
                className="block text-xl text-orange-100 hover:text-orange-400 transition-colors py-3 border-b border-orange-900/20"
                onClick={onClose}
              >
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-orange-500" />
                  <span>Featured Projects</span>
                </div>
              </Link>
              <Link
                href="#about"
                className="block text-xl text-orange-100 hover:text-orange-400 transition-colors py-3 border-b border-orange-900/20"
                onClick={onClose}
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-orange-500" />
                  <span>About Us</span>
                </div>
              </Link>
            </div>
          </nav>

          {/* Mobile menu footer */}
          <div className="p-6 border-t border-orange-800/30">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg" onClick={onClose}>
              <Link href="#contact" className="flex items-center justify-center">
                <Mail className="mr-2 h-5 w-5" />
                Contact Us
              </Link>
            </Button>

            {/* Contact info in mobile menu */}
            <div className="mt-6 space-y-3 text-sm text-orange-300">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-orange-500" />
                <span>contact@enchiridiontech.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-orange-500" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
