"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

interface WishlistItem {
  id: number
  name: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  colors: string[]
  category: string
  addedDate: string
  sizes?: string[];
  rating?: number;
}

interface WishlistState {
  items: WishlistItem[]
  itemCount: number
}

type WishlistAction =
  | { type: "ADD_ITEM"; payload: WishlistItem }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "CLEAR_WISHLIST" }
  | { type: "LOAD_WISHLIST"; payload: WishlistItem[] }

const WishlistContext = createContext<{
  state: WishlistState
  dispatch: React.Dispatch<WishlistAction>
  addToWishlist: (item: Omit<WishlistItem, "addedDate">) => void
  removeFromWishlist: (id: number) => void
  clearWishlist: () => void
  isInWishlist: (id: number) => boolean
} | null>(null)

const wishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex((item) => item.id === action.payload.id)

      if (existingItemIndex >= 0) {
        // Item already exists, don't add duplicate
        return state
      }

      const newItems = [...state.items, action.payload]
      return {
        items: newItems,
        itemCount: newItems.length,
      }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.payload)
      return {
        items: newItems,
        itemCount: newItems.length,
      }
    }

    case "CLEAR_WISHLIST":
      return {
        items: [],
        itemCount: 0,
      }

    case "LOAD_WISHLIST":
      return {
        items: action.payload,
        itemCount: action.payload.length,
      }

    default:
      return state
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, {
    items: [],
    itemCount: 0,
  })
  const { user, loading } = useAuth()
  const isAuthenticated = !!user && !loading
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  // Load wishlist from API for authenticated users or localStorage for guests
  useEffect(() => {
    // Replace the loadWishlist function around line 90-115
    const loadWishlist = async () => {
      if (isAuthenticated && token) {
        try {
          const response = await fetch('/api/wishlist', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            const wishlistItems = await response.json()
            console.log('📦 Wishlist data from API:', wishlistItems)
            // Use database images directly - no mapping needed
            dispatch({ type: "LOAD_WISHLIST", payload: wishlistItems })
            // Clear localStorage to prevent conflicts with database data
            if (typeof window !== "undefined") {
              localStorage.removeItem("gkicks-wishlist")
            }
          } else {
            console.error('Failed to load wishlist from API:', response.status)
            // For authenticated users, start with empty wishlist if API fails
            dispatch({ type: "LOAD_WISHLIST", payload: [] })
          }
        } catch (error) {
          console.error("Error loading wishlist from API:", error)
          // For authenticated users, start with empty wishlist if API fails
          dispatch({ type: "LOAD_WISHLIST", payload: [] })
        }
      } else {
        loadFromLocalStorage()
      }
    }

    const loadFromLocalStorage = () => {
      if (typeof window !== "undefined") {
        const savedWishlist = localStorage.getItem("gkicks-wishlist")
        if (savedWishlist) {
          try {
            const wishlistItems = JSON.parse(savedWishlist)
            console.log("🔍 Loading wishlist from localStorage:", wishlistItems)
            
            // Migrate existing items to fix image mapping
            const migratedItems = wishlistItems.map((item: any) => {
              const hasValidImage = item.image && item.image !== '/placeholder.svg' && item.image !== '/placeholder-product.jpg' && item.image !== '/placeholder.jpg'
              
              if (!hasValidImage) {
                // Try to map product name to actual image file
                let correctedImage = item.image_url || item.image
                
                // Use database images directly - no hardcoded mappings
                if (item.image_url && item.image_url !== '/placeholder-product.jpg' && item.image_url !== '/placeholder.jpg') {
                  correctedImage = item.image_url
                  console.log(`🔄 Migrating item ${item.id} - ${item.name}: ${item.image} -> ${correctedImage}`)
                }
                
                return {
                  ...item,
                  image: correctedImage
                }
              }
              return item
            })
            
            // Save migrated items back to localStorage if any changes were made
            const hasChanges = JSON.stringify(migratedItems) !== JSON.stringify(wishlistItems)
            if (hasChanges) {
              localStorage.setItem("gkicks-wishlist", JSON.stringify(migratedItems))
              console.log("✅ Migrated wishlist items with corrected image mapping")
            }
            
            migratedItems.forEach((item: any, index: number) => {
              console.log(`Item ${index + 1}:`, {
                id: item.id,
                name: item.name,
                image: item.image,
                hasImage: !!item.image,
                imageValid: item.image && item.image !== '/placeholder.svg' && item.image !== '/placeholder-product.jpg'
              })
            })
            
            dispatch({ type: "LOAD_WISHLIST", payload: migratedItems })
          } catch (error) {
            console.error("Error loading wishlist from localStorage:", error)
          }
        }
      }
    }

    loadWishlist()
  }, [isAuthenticated, token])

  // Save wishlist to localStorage for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      localStorage.setItem("gkicks-wishlist", JSON.stringify(state.items))
    }
  }, [state.items, isAuthenticated])

  const addToWishlist = async (item: Omit<WishlistItem, "addedDate">) => {
    // Use database image directly - no mapping needed since database has correct images
    const normalizedItem = {
      ...item,
      image: (item as any).image_url || item.image || '/placeholder.svg'
    }
    
    console.log(`📦 Adding item to wishlist: ${normalizedItem.name} with image: ${normalizedItem.image}`)
    
    if (isAuthenticated && token) {
      try {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: normalizedItem.id }),
        })
        
        if (response.ok) {
          const wishlistItem: WishlistItem = {
            ...normalizedItem,
            addedDate: new Date().toISOString(),
          }
          dispatch({ type: "ADD_ITEM", payload: wishlistItem })
        }
      } catch (error) {
        console.error("Error adding to wishlist:", error)
      }
    } else {
      // For non-authenticated users, use local storage
      const wishlistItem: WishlistItem = {
        ...normalizedItem,
        addedDate: new Date().toISOString(),
      }
      console.log("🔍 Adding item to localStorage wishlist:", {
        id: wishlistItem.id,
        name: wishlistItem.name,
        image: wishlistItem.image,
        hasImage: !!wishlistItem.image,
        originalImageUrl: (item as any).image_url,
        mappingWorked: wishlistItem.image !== '/placeholder.svg' && !!wishlistItem.image,
        originalItem: item,
        normalizedItem: normalizedItem,
        finalWishlistItem: wishlistItem
      })
      
      // Also log to localStorage for debugging
      console.log("📝 Current localStorage before adding:", localStorage.getItem('gkicks-wishlist'))
      
      // After dispatch, log the updated localStorage
      setTimeout(() => {
        console.log("📝 Updated localStorage after adding:", localStorage.getItem('gkicks-wishlist'))
      }, 100)
      dispatch({ type: "ADD_ITEM", payload: wishlistItem })
    }
  }

  const removeFromWishlist = async (id: number) => {
    if (isAuthenticated && token) {
      try {
        const response = await fetch(`/api/wishlist?productId=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          dispatch({ type: "REMOVE_ITEM", payload: id })
        }
      } catch (error) {
        console.error("Error removing from wishlist:", error)
      }
    } else {
      // For non-authenticated users, use local storage
      dispatch({ type: "REMOVE_ITEM", payload: id })
    }
  }

  const clearWishlist = async () => {
    if (isAuthenticated && token) {
      try {
        const response = await fetch('/api/wishlist/clear', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          dispatch({ type: "CLEAR_WISHLIST" })
        }
      } catch (error) {
        console.error("Error clearing wishlist:", error)
      }
    } else {
      dispatch({ type: "CLEAR_WISHLIST" })
    }
  }

  const isInWishlist = (id: number) => {
    return state.items.some((item) => item.id === id)
  }

  return (
    <WishlistContext.Provider
      value={{
        state,
        dispatch,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
