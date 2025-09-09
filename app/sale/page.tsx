"use client"

export const dynamic = 'force-dynamic'


import { ProductGrid } from "@/components/product-grid"
import { useCart } from "@/contexts/cart-context"
import { useState, useEffect } from "react"
// Removed Supabase import - now using API endpoints

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || ""

export default function SalePage() {
  const [products, setProducts] = useState<any[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const { state } = useCart()

  useEffect(() => {
    async function fetchSaleProducts() {
      try {
        const response = await fetch('/api/products?is_sale=true')
        if (!response.ok) {
          throw new Error('Failed to fetch sale products')
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
        console.error("Error fetching sale products:", error)
        setProducts([])
      }
    }
    fetchSaleProducts()
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
              Sale Items
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
              Discover incredible deals on premium sneakers and footwear. Browse our selection of sale items and find your next favorite pair at a great price.
            </p>
          </div>

          {/* Product Grid */}
          <ProductGrid category="sale" products={products} onWishlistUpdate={handleWishlistUpdate} />
        </div>
      </main>
    </div>
  )
}
