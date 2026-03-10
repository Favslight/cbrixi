"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import CbrixiLogo from "../../../components/CbrixiLogo";

const authImages = [
  { src: "/images/laptop.png", alt: "Premium CBRIXI Laptop" },
  { src: "/images/earbuds.png", alt: "Premium CBRIXI Earbuds" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % authImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex selection:bg-blue-500/30 bg-[#07070a] text-white">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="flex w-full h-full min-h-screen">
        {/* Left Side - Image Showcase */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12 bg-gradient-to-br from-gray-900 via-black to-gray-950 border-r border-white/5">
          {/* Logo overlay */}
          <div className="absolute top-8 left-10 z-20">
            <CbrixiLogo />
          </div>

          {/* Marketing Copy */}
          <div className="absolute bottom-20 left-12 z-20 max-w-md">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-white">
              The Future of Tech.
            </h2>
            <p className="text-white/60 text-lg leading-relaxed">
              Experience seamless integration across all your smart devices with the revolutionary CBRIXI ecosystem.
            </p>
          </div>

          {/* Product Carousel */}
          <div className="relative w-full h-[600px] flex items-center justify-center z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative w-[120%] h-[120%]"
              >
                <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full scale-75" />
                <Image
                  src={authImages[currentImageIndex].src}
                  alt={authImages[currentImageIndex].alt}
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pagination */}
          <div className="absolute bottom-10 left-12 flex space-x-3 z-20">
            {authImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`transition-all duration-300 rounded-full ${index === currentImageIndex
                  ? "w-8 h-2 bg-gradient-to-r from-blue-500 to-purple-500"
                  : "w-2 h-2 bg-white/20 hover:bg-white/40"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Auth Forms Container */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 backdrop-blur-3xl lg:backdrop-blur-none bg-black/40 lg:bg-transparent">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
