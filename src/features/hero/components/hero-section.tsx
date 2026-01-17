"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Cloud, Brain, Code } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ShimmerButton } from "@/components/shimmer-button"

const services = [
  { icon: Cloud, label: "Cloud Infrastructure" },
  { icon: Brain, label: "AI Development" },
  { icon: Code, label: "Web Development" },
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background logo with overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/scroll-hd.png"
            alt=""
            width={800}
            height={800}
            className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] lg:w-[900px] lg:h-[900px] object-contain opacity-[0.08]"
            priority
          />
        </div>
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
        {/* Warm orange glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-orange-600/10 rounded-full blur-3xl" />
        
        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Animated SVG threads overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="neonPulse1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,1)" />
              <stop offset="30%" stopColor="rgba(251,146,60,1)" />
              <stop offset="70%" stopColor="rgba(249,115,22,0.8)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0)" />
            </radialGradient>
            <radialGradient id="neonPulse2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="25%" stopColor="rgba(251,146,60,0.9)" />
              <stop offset="60%" stopColor="rgba(234,88,12,0.7)" />
              <stop offset="100%" stopColor="rgba(234,88,12,0)" />
            </radialGradient>
            <radialGradient id="neonPulse3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,1)" />
              <stop offset="35%" stopColor="rgba(251,146,60,1)" />
              <stop offset="75%" stopColor="rgba(234,88,12,0.6)" />
              <stop offset="100%" stopColor="rgba(234,88,12,0)" />
            </radialGradient>
            <filter id="noiseTexture" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence baseFrequency="0.65" numOctaves="4" result="noise" type="fractalNoise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="monoNoise" />
              <feComponentTransfer in="monoNoise" result="alphaAdjustedNoise">
                <feFuncA type="linear" slope="0.4" intercept="0" />
              </feComponentTransfer>
            </filter>
            <linearGradient id="threadFade1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,1)" />
              <stop offset="15%" stopColor="rgba(249,115,22,0.8)" />
              <stop offset="85%" stopColor="rgba(249,115,22,0.8)" />
              <stop offset="100%" stopColor="rgba(0,0,0,1)" />
            </linearGradient>
            <linearGradient id="threadFade2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,1)" />
              <stop offset="12%" stopColor="rgba(251,146,60,0.7)" />
              <stop offset="88%" stopColor="rgba(251,146,60,0.7)" />
              <stop offset="100%" stopColor="rgba(0,0,0,1)" />
            </linearGradient>
            <linearGradient id="threadFade3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,1)" />
              <stop offset="18%" stopColor="rgba(234,88,12,0.8)" />
              <stop offset="82%" stopColor="rgba(234,88,12,0.8)" />
              <stop offset="100%" stopColor="rgba(0,0,0,1)" />
            </linearGradient>
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="100%" height="100%" filter="url(#noiseTexture)" opacity="0.15" fill="white" />

          <g>
            {/* Thread 1 */}
            <path
              id="thread1"
              d="M50 720 Q200 590 350 540 Q500 490 650 520 Q800 550 950 460 Q1100 370 1200 340"
              stroke="url(#threadFade1)"
              strokeWidth="0.8"
              fill="none"
              opacity="0.8"
            />
            <circle r="2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="4s" repeatCount="indefinite">
                <mpath href="#thread1" />
              </animateMotion>
            </circle>

            {/* Thread 2 */}
            <path
              id="thread2"
              d="M80 730 Q250 620 400 570 Q550 520 700 550 Q850 580 1000 490 Q1150 400 1300 370"
              stroke="url(#threadFade2)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
            />
            <circle r="3" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="5s" repeatCount="indefinite">
                <mpath href="#thread2" />
              </animateMotion>
            </circle>

            {/* Thread 3 */}
            <path
              id="thread3"
              d="M20 710 Q180 580 320 530 Q460 480 600 510 Q740 540 880 450 Q1020 360 1200 330"
              stroke="url(#threadFade3)"
              strokeWidth="1.2"
              fill="none"
              opacity="0.8"
            />
            <circle r="2.5" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="4.5s" repeatCount="indefinite">
                <mpath href="#thread3" />
              </animateMotion>
            </circle>

            {/* Thread 4 */}
            <path
              id="thread4"
              d="M120 740 Q280 640 450 590 Q620 540 770 570 Q920 600 1070 510 Q1220 420 1350 390"
              stroke="url(#threadFade1)"
              strokeWidth="0.6"
              fill="none"
              opacity="0.6"
            />
            <circle r="1.5" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="5.5s" repeatCount="indefinite">
                <mpath href="#thread4" />
              </animateMotion>
            </circle>

            {/* Thread 5 */}
            <path
              id="thread5"
              d="M60 725 Q220 600 380 550 Q540 500 680 530 Q820 560 960 470 Q1100 380 1280 350"
              stroke="url(#threadFade2)"
              strokeWidth="1.0"
              fill="none"
              opacity="0.7"
            />
            <circle r="2.2" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="4.2s" repeatCount="indefinite">
                <mpath href="#thread5" />
              </animateMotion>
            </circle>

            {/* Thread 6 */}
            <path
              id="thread6"
              d="M150 735 Q300 660 480 610 Q660 560 800 590 Q940 620 1080 530 Q1220 440 1400 410"
              stroke="url(#threadFade3)"
              strokeWidth="1.3"
              fill="none"
              opacity="0.6"
            />
            <circle r="2.8" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="5.2s" repeatCount="indefinite">
                <mpath href="#thread6" />
              </animateMotion>
            </circle>

            {/* Thread 7 */}
            <path
              id="thread7"
              d="M40 715 Q190 585 340 535 Q490 485 630 515 Q770 545 910 455 Q1050 365 1250 335"
              stroke="url(#threadFade1)"
              strokeWidth="0.9"
              fill="none"
              opacity="0.8"
            />
            <circle r="2" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="4.8s" repeatCount="indefinite">
                <mpath href="#thread7" />
              </animateMotion>
            </circle>

            {/* Thread 8 */}
            <path
              id="thread8"
              d="M100 728 Q260 630 420 580 Q580 530 720 560 Q860 590 1000 500 Q1140 410 1320 380"
              stroke="url(#threadFade2)"
              strokeWidth="1.4"
              fill="none"
              opacity="0.7"
            />
            <circle r="3" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="5.8s" repeatCount="indefinite">
                <mpath href="#thread8" />
              </animateMotion>
            </circle>

            {/* Thread 9 */}
            <path
              id="thread9"
              d="M30 722 Q170 595 310 545 Q450 495 590 525 Q730 555 870 465 Q1010 375 1180 345"
              stroke="url(#threadFade3)"
              strokeWidth="0.5"
              fill="none"
              opacity="0.6"
            />
            <circle r="1.2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="6s" repeatCount="indefinite">
                <mpath href="#thread9" />
              </animateMotion>
            </circle>

            {/* Thread 10 */}
            <path
              id="thread10"
              d="M90 732 Q240 625 390 575 Q540 525 680 555 Q820 585 960 495 Q1100 405 1300 375"
              stroke="url(#threadFade1)"
              strokeWidth="1.1"
              fill="none"
              opacity="0.8"
            />
            <circle r="2.5" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="4.3s" repeatCount="indefinite">
                <mpath href="#thread10" />
              </animateMotion>
            </circle>

            {/* Thread 11 */}
            <path
              id="thread11"
              d="M70 727 Q210 605 360 555 Q510 505 650 535 Q790 565 930 475 Q1070 385 1260 355"
              stroke="url(#threadFade2)"
              strokeWidth="0.4"
              fill="none"
              opacity="0.5"
            />
            <circle r="1" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="5.7s" repeatCount="indefinite">
                <mpath href="#thread11" />
              </animateMotion>
            </circle>

            {/* Thread 12 */}
            <path
              id="thread12"
              d="M110 738 Q270 645 430 595 Q590 545 730 575 Q870 605 1010 515 Q1150 425 1380 395"
              stroke="url(#threadFade3)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
            />
            <circle r="3.2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="4.7s" repeatCount="indefinite">
                <mpath href="#thread12" />
              </animateMotion>
            </circle>
          </g>
        </svg>
      </div>

      {/* Main Content */}
      <div className="container relative z-10 mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Company Name */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent tracking-tight animate-fade-in">
            Enchiridion Technologies
          </h1>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-orange-200/80 mb-10 max-w-2xl mx-auto animate-fade-in-delay">
            A software studio building modern infrastructure and intelligent applications.
          </p>

          {/* Service Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in-delay-2">
            {services.map((service) => {
              const IconComponent = service.icon
              return (
                <div
                  key={service.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-950/40 border border-orange-800/30 text-orange-200"
                >
                  <IconComponent className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium">{service.label}</span>
                </div>
              )
            })}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3">
            <Button className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base lg:text-lg font-semibold flex items-center gap-2 backdrop-blur-sm border border-orange-400/30 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5">
              <Link href="#contact" className="flex items-center">
                Start a Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <ShimmerButton className="hidden md:flex bg-orange-500 hover:bg-orange-600 text-white px-4 lg:px-6 py-2 rounded-xl text-sm lg:text-base font-medium shadow-lg">
              <Link href="#projects">View Our Work</Link>
            </ShimmerButton>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-fade-in-delay-3">
        <div className="w-6 h-10 rounded-full border-2 border-orange-700/40 flex justify-center items-start p-1">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-scroll-bounce" />
        </div>
      </div>
    </section>
  )
}

