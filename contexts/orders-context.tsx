"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
// Supabase import removed - now using MySQL-based data fetching

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  color: string
  size: string
  image: string
}

export interface Order {
  id: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  items: OrderItem[]
  total: number
  shippingAddress: {
    fullName: string
    street: string
    city: string
    province: string
    zipCode: string
    phone: string
  }
  paymentMethod: string
  customerEmail: string
  orderDate: string
  trackingNumber?: string
  estimatedDelivery?: string
}

interface OrdersState {
  orders: Order[]
  isLoading: boolean
}

type OrdersAction =
  | { type: "ADD_ORDER"; payload: Omit<Order, "id" | "orderDate"> }
  | { type: "UPDATE_ORDER_STATUS"; payload: { id: string; status: Order["status"]; trackingNumber?: string } }
  | { type: "LOAD_ORDERS"; payload: Order[] }
  | { type: "SET_LOADING"; payload: boolean }

const initialState: OrdersState = {
  orders: [],
  isLoading: false,
}

function ordersReducer(state: OrdersState, action: OrdersAction): OrdersState {
  switch (action.type) {
    case "ADD_ORDER": {
      const newOrder: Order = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        orderDate: new Date().toISOString(),
      }
      return {
        ...state,
        orders: [newOrder, ...state.orders],
      }
    }

    case "UPDATE_ORDER_STATUS": {
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.id
            ? {
                ...order,
                status: action.payload.status,
                trackingNumber: action.payload.trackingNumber || order.trackingNumber,
              }
            : order,
        ),
      }
    }

    case "LOAD_ORDERS":
      return {
        ...state,
        orders: action.payload,
        isLoading: false,
      }

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }

    default:
      return state
  }
}

async function decreaseVariantStock(productId: string, color: string, size: string, quantity: number) {
  try {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`/api/products/stock?id=${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        color,
        size,
        quantity
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update product stock')
    }

    const data = await response.json()
    return { variants: data.variants, totalStock: data.totalStock }
  } catch (error) {
    console.error("Failed to update product variants:", error)
    throw error
  }
}

const OrdersContext = createContext<{
  state: OrdersState
  addOrder: (order: Omit<Order, "id" | "orderDate">) => Promise<void>
  updateOrderStatus: (id: string, status: Order["status"], trackingNumber?: string) => void
  getOrdersByEmail: (email: string) => Order[]
  getAllOrders: () => Order[]
} | null>(null)

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(ordersReducer, initialState)

  useEffect(() => {
    const savedOrders = localStorage.getItem("gkicks-orders")
    if (savedOrders) {
      try {
        const orders = JSON.parse(savedOrders)
        dispatch({ type: "LOAD_ORDERS", payload: orders })
      } catch (error) {
        console.error("Failed to load orders:", error)
        dispatch({ type: "LOAD_ORDERS", payload: [] })
      }
    } else {
      dispatch({ type: "LOAD_ORDERS", payload: [] })
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("gkicks-orders", JSON.stringify(state.orders))
  }, [state.orders])

  // Async addOrder to decrease stock in DB before adding order locally
  const addOrder = async (order: Omit<Order, "id" | "orderDate">) => {
    try {
      // Validate stock for all items before processing any
      for (const item of order.items) {
        const response = await fetch(`/api/products/${item.id}`);
        if (response.ok) {
          const product = await response.json();
          const variants = product.variants || {};
          const availableStock = variants[item.color]?.[item.size] || 0;
          
          if (availableStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name} (${item.color}, ${item.size}). Only ${availableStock} available.`);
          }
        }
      }
      
      // Process stock reduction for all items
      for (const item of order.items) {
        await decreaseVariantStock(item.id, item.color, item.size, item.quantity);
      }
      
      dispatch({ type: "ADD_ORDER", payload: order });
    } catch (error) {
      console.error("Error processing order stock update:", error);
      throw error; // Re-throw to allow caller to handle the error
    }
  }

  const updateOrderStatus = (id: string, status: Order["status"], trackingNumber?: string) => {
    dispatch({ type: "UPDATE_ORDER_STATUS", payload: { id, status, trackingNumber } })
  }

  const getOrdersByEmail = (email: string) => {
    return state.orders.filter((order) => order.customerEmail === email)
  }

  const getAllOrders = () => {
    return state.orders
  }

  return (
    <OrdersContext.Provider
      value={{
        state,
        addOrder,
        updateOrderStatus,
        getOrdersByEmail,
        getAllOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider")
  }
  return context
}
