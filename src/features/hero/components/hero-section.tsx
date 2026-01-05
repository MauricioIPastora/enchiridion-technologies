"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import MatrixRain from "@/components/matrix-rain";

export function HeroSection() {
  const [showMatrix, setShowMatrix] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {showMatrix && (
        <MatrixRain className="z-0" fontSize={16} color="#fb923c" speed={0.6} />
      )}

      {/* Animated blob backgrounds */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-orange-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block mb-6">
              <div className="relative px-3 py-1 text-sm font-medium rounded-full bg-orange-500/10 backdrop-blur-sm border border-orange-500/20">
                <span className="relative z-10 text-orange-300">
                  Ancient Knowledge, Modern Solutions
                </span>
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 animate-pulse"></span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.div
              className="relative group cursor-pointer"
              onHoverStart={() => setShowMatrix(true)}
              onHoverEnd={() => setShowMatrix(false)}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
              <motion.div
                className="relative"
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src="/scroll-hd.png"
                  alt="Enchiridion Technologies Scroll Logo"
                  width={200}
                  height={200}
                  className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 drop-shadow-2xl group-hover:drop-shadow-[0_0_30px_rgba(251,146,60,0.6)] transition-all duration-300"
                  priority
                />
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-600 bg-clip-text text-transparent pb-4 cursor-pointer relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onMouseEnter={() => setShowMatrix(true)}
            onMouseLeave={() => setShowMatrix(false)}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></span>
            Enchiridion Technologies
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-orange-200 mb-8 leading-relaxed relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Specializing in AI products, Web development, and custom software
            solutions, <br /> we craft digital experiences with the precision of
            ancient scribes and the innovation of modern technology.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button
              size="lg"
              className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-700 border-0 text-white px-8"
            >
              <Link href="#contact" className="flex items-center relative z-10">
                Begin Your Journey{" "}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="absolute inset-0 bg-gradient-to-r from-orange-700 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white bg-transparent"
            >
              <Link href="#projects">View Our Work</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-orange-500/20 flex justify-center items-start p-1">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500/60 animate-pulse"></div>
        </div>
      </motion.div>
    </section>
  );
}
