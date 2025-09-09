"use client"

export const dynamic = 'force-dynamic'


import { ProductGrid } from "@/components/product-grid"
import { useCart } from "@/contexts/cart-context"
import { useState, useEffect } from "react"
// Removed Supabase import - now using API endpoints

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || ""

export default function KidsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const { state } = useCart()

  useEffect(() => {
    async function fetchKidsProducts() {
      try {
        const response = await fetch('/api/products?category=kids')
        if (!response.ok) {
          throw new Error('Failed to fetch kids products')
        }
        const data = await response.json()
        
        const fixedProducts = (data ?? []).map((product: any) => ({
          ...product,
          image_url: product.image_url.startsWith("http")
            ? product.image_url
            : `${BASE_URL}${product.image_url}`,
        }))
        setProducts(fixedProducts)
      } catch (error) {
        console.error("Error fetching kids products:", error)
        setProducts([])
      }
    }
    fetchKidsProducts()
  }, [])

  const handleWishlistUpdate = (change: number) => {
    setWishlistCount((prev) => Math.max(0, prev + change))
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-yellow-400 mb-2">
              Kids' Shoes
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
              Fun and comfortable footwear designed for active kids. From playground adventures to special occasions, find the perfect shoes that kids will love to wear.
            </p>
          </div>

          {/* Product Grid */}
          <ProductGrid category="kids" products={products} onWishlistUpdate={handleWishlistUpdate} />
        </div>
      </main>
    </div>
  )
}
