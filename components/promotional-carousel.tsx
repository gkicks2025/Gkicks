"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, ShoppingBag, Star, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface PromotionalSlide {
  id: number
  title: string
  subtitle: string
  description: string
  ctaText: string
  bgGradient: string
  image: string
  isActive: boolean
  order?: number
}

// Default icon mapping based on slide content
const getSlideIcon = (title: string) => {
  if (title.toLowerCase().includes('deal') || title.toLowerCase().includes('exclusive')) {
    return <ShoppingBag className="w-8 h-8" />
  }
  if (title.toLowerCase().includes('premium') || title.toLowerCase().includes('experience')) {
    return <Star className="w-8 h-8" />
  }
  if (title.toLowerCase().includes('community') || title.toLowerCase().includes('join')) {
    return <Users className="w-8 h-8" />
  }
  if (title.toLowerCase().includes('fast') || title.toLowerCase().includes('checkout')) {
    return <Zap className="w-8 h-8" />
  }
  return <ShoppingBag className="w-8 h-8" /> // Default icon
}

export function PromotionalCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [slides, setSlides] = useState<PromotionalSlide[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch slides from API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/carousel')
        if (response.ok) {
          const data = await response.json()
          // Filter only active slides for public display and sort by order
          const activeSlides = data
            .filter((slide: PromotionalSlide) => slide.isActive)
            .sort((a: PromotionalSlide, b: PromotionalSlide) => (a.order || 0) - (b.order || 0))
          setSlides(activeSlides)
        } else {
          console.error('Failed to fetch carousel slides')
        }
      } catch (error) {
        console.error('Error fetching carousel slides:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSlides()
  }, [])

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000) // Resume auto-play after 10s
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000) // Resume auto-play after 10s
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000) // Resume auto-play after 10s
  }

  const handleSignUp = () => {
    router.push("/auth")
  }

  if (loading) {
    return (
      <div className="relative w-full mb-8 mt-12">
        <Card className="overflow-hidden border-2 border-yellow-400 shadow-2xl">
          <CardContent className="p-0">
            <div className="relative bg-gradient-to-br from-gray-400 to-gray-600 text-white min-h-[300px] sm:min-h-[350px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading carousel...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="relative w-full mb-8 mt-12">
        <Card className="overflow-hidden border-2 border-yellow-400 shadow-2xl">
          <CardContent className="p-0">
            <div className="relative bg-gradient-to-br from-gray-400 to-gray-600 text-white min-h-[300px] sm:min-h-[350px] flex items-center justify-center">
              <div className="text-center">
                <p>No carousel slides available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const slide = slides[currentSlide]

  return (
    <div className="relative w-full mb-8 mt-12">
      <Card className="overflow-hidden border-2 border-yellow-400 shadow-2xl">
        <CardContent className="p-0">
          <div className={`relative bg-gradient-to-br ${slide.bgGradient} text-white min-h-[300px] sm:min-h-[350px] flex items-center`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12 py-8 sm:py-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left Content */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      {getSlideIcon(slide.title)}
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      Limited Time
                    </Badge>
                  </div>

                  <div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-xl sm:text-2xl font-semibold text-white/90 mb-4">
                      {slide.subtitle}
                    </p>
                    <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-md">
                      {slide.description}
                    </p>
                  </div>

                  <Button
                    onClick={handleSignUp}
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-gray-100 font-bold text-lg px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    {slide.ctaText}
                  </Button>
                </div>

                {/* Right Content - Product Image & Features */}
                <div className="space-y-4">
                  <div className="relative w-full h-64 sm:h-80 lg:h-96 mb-6">
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      className="object-contain drop-shadow-2xl"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all duration-200 group z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all duration-200 group z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Slide Indicators */}
      <div className="flex justify-center space-x-1 mt-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-200 ${
              currentSlide === index
                ? "bg-yellow-400"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
            style={{ width: '10px', height: '10px', minWidth: '10px', minHeight: '10px' }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`w-2 h-2 rounded-full ${isAutoPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
      </div>
    </div>
  )
}