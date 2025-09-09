export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          birthdate: string | null
          gender: string | null
          bio: string | null
          avatar_url: string | null
          preferences: {
            newsletter: boolean
            sms_notifications: boolean
            email_notifications: boolean
            preferred_language: string
            currency: string
          } | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          birthdate?: string | null
          gender?: string | null
          bio?: string | null
          avatar_url?: string | null
          preferences?: {
            newsletter: boolean
            sms_notifications: boolean
            email_notifications: boolean
            preferred_language: string
            currency: string
          } | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          birthdate?: string | null
          gender?: string | null
          bio?: string | null
          avatar_url?: string | null
          preferences?: {
            newsletter: boolean
            sms_notifications: boolean
            email_notifications: boolean
            preferred_language: string
            currency: string
          } | null
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          street_address: string | null
          city: string | null
          state_province: string | null
          zip_code: string | null
          country: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          street_address?: string | null
          city?: string | null
          state_province?: string | null
          zip_code?: string | null
          country?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          street_address?: string | null
          city?: string | null
          state_province?: string | null
          zip_code?: string | null
          country?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          brand: string
          price: number
          category: string
          gender: string
          stock_quantity: number
          low_stock_threshold: number
          image_url: string
          description: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          brand: string
          price: number
          category: string
          gender: string
          stock_quantity?: number
          low_stock_threshold?: number
          image_url?: string
          description?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string
          price?: number
          category?: string
          gender?: string
          stock_quantity?: number
          low_stock_threshold?: number
          image_url?: string
          description?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          status: string
          shipping_address: any
          payment_method: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          status?: string
          shipping_address?: any
          payment_method?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          status?: string
          shipping_address?: any
          payment_method?: string
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          role: string
          permissions: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: string
          permissions?: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          permissions?: string[]
          is_active?: boolean
          created_at?: string
        }
      }
    }
  }
}
