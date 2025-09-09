"use client"
import Image from "next/image"

export function Hero() {
  return (
    <section className="relative h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/hero-background.jpg" alt="Hero background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">Step Into Style</h1>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
          Discover the latest collection of premium sneakers from top brands. Find your perfect pair and elevate your
          style game.
        </p>
      </div>
    </section>
  )
}
