export interface User {
  id: string
  username: string
  name: string
  avatar?: string
  initials: string
  status: "online" | "offline" | "away"
  role: "admin" | "user"
  lastSeen?: string
  created_at?: string
}

export interface AuthState {
  token: string
  user: User
}

export interface Message {
  id: string
  room_id: string
  content: string
  sender_id: string
  sender_name: string
  timestamp: Date
  status: "sent" | "delivered" | "read"
  parent_id?: string
  fb_message_id?: string
}

export interface ChatRoom {
  id: string
  name: string
  type: "direct" | "group"
  avatar?: string
  initials: string
  participants?: User[]
  unreadCount: number
  user_id?: string
  chatbot_enabled?: boolean
}

export interface Category {
  id: string
  name: string
}

export interface Unit {
  id: string
  name: string
}

export interface Size {
  id: string
  name: string
}

export interface ProductLine {
  id: string
  name: string
  expiry?: string
  category_id: string
  unit_id: string
  category: Category
  unit: Unit
  keywords?: string
}

export interface Product {
  id: string
  sku: string
  name: string
  price: number
  model_code?: string
  image_url?: string
  surcharge: number
  product_line_id: string
  size_id: string
  description?: string
  product_line: ProductLine
  size: Size
}

export interface FAQ {
  id: string
  question: string
  answer: string
}

export interface ComboItem {
  id: string
  product_id: string
  quantity: number
  product?: Product
}

export interface Combo {
  id: string
  sku: string
  name: string
  price: number
  image_url?: string
  description?: string
  items: ComboItem[]
}

export interface DraftOrderItem {
  id: string
  product_id: string
  product_name: string
  price: number
  quantity: number
}

export type DraftOrderStatus = "pending" | "approved" | "rejected"

export interface DraftOrder {
  id: string
  room_id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  delivery_time?: string | null
  status: DraftOrderStatus
  total_price: number
  custom_fields?: string
  created_at: string
  items: DraftOrderItem[]
}

export interface OrderFieldConfig {
  id: string
  key: string
  label: string
  type: "text" | "number" | "select" | "datetime"
  required: boolean
  active: boolean
  options?: string[]
  is_core: boolean
}



