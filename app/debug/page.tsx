"use client"

import { useState, useEffect } from "react"
import { fetchProductsFromAPI } from "@/lib/product-data"
import type { Product } from "@/lib/product-data"

export default function DebugPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    async function loadProducts() {
      try {
        addLog('🔍 Starting to fetch products from Supabase...')
        setLoading(true)
        
        const fetchedProducts = await fetchProductsFromAPI()
        
        addLog(`📦 Fetched ${fetchedProducts.length} products`)
        
        if (fetchedProducts.length > 0) {
          addLog(`📋 First product: ${fetchedProducts[0].name} (${fetchedProducts[0].brand})`)
        } else {
          addLog('⚠️ No products returned from fetch function')
        }
        
        setProducts(fetchedProducts)
        setLoading(false)
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        addLog(`❌ Error fetching products: ${errorMessage}`)
        setError(errorMessage)
        setLoading(false)
      }
    }
    
    loadProducts()
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          🐛 Debug Page - Product Loading
        </h1>
        
        {/* Status */}
        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Status</h2>
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              Loading: <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                {loading ? 'Yes' : 'No'}
              </span>
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Products Count: <span className="font-mono text-blue-600">{products.length}</span>
            </p>
            {error && (
              <p className="text-red-600">
                Error: {error}
              </p>
            )}
          </div>
        </div>
        
        {/* Logs */}
        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Debug Logs</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
        
        {/* Products List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Products ({products.length})
          </h2>
          
          {products.length === 0 ? (
            <div className="p-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
              <p className="text-yellow-800 dark:text-yellow-200 text-lg">
                No products loaded
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <div key={product.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {product.brand} • ₱{product.price} • {product.category}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {product.isNew && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            NEW
                          </span>
                        )}
                        {product.isSale && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            SALE
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <p>ID: {product.id}</p>
                      <p>Views: {product.views}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}