export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  user_type: 'customer' | 'provider'
  country_code: string
  city: string
  address: string
  postal_code: string
  latitude: number | null
  longitude: number | null
  birth_date: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  medical_notes: string | null
  preferred_language: string
  profile_image: string | null
  created_at: string
}

export interface ServiceProvider {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  country_code: string
  city: string
  specialties: string[]
  bio: string | null
  years_experience: number
  certifications: string[]
  profile_image: string | null
  rating: number
  total_ratings: number
  is_verified: boolean
  is_christian: boolean
  stripe_connect_id: string | null
  created_at: string
}

export interface Booking {
  id: string
  booking_number: string
  provider_id: string
  customer_id: string
  service_id: string
  booking_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  address: string
  special_instructions: string | null
  total_price: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  payment_status: 'UNPAID' | 'PAID' | 'REFUNDED'
  created_at: string
}

export interface AvailabilityWindow {
  id: string
  provider_id: string
  day_of_week: number
  slot_name: string
  start_time: string
  end_time: string
  break_duration_minutes: number
  is_available: boolean
}

export interface Review {
  id: string
  booking_id: string
  rating: number
  review: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface PaymentTransaction {
  id: string
  booking_id: string
  amount: number
  currency: string
  status: string
  created_at: string
}

export interface DashboardStats {
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  totalEarnings: number
  averageRating: number
  responseRate: number
}

export interface TimeSlot {
  date: string
  start_time: string
  end_time: string
  is_available: boolean
}

export interface PricingTier {
  hours: number
  multiplier: number
  description: string
}

// Funding options for NDIS and other funding sources
export const FUNDING_OPTIONS = [
  { id: 'self_funded', name: 'Self Funded', name_zh: '自费' },
  { id: 'ndis', name: 'NDIS', name_zh: 'NDIS' },
  { id: 'home_care_package', name: 'Home Care Package', name_zh: '家庭护理套餐' },
  { id: 'aged_care', name: 'Aged Care', name_zh: '老年护理' },
  { id: 'private_health', name: 'Private Health Insurance', name_zh: '私人健康保险' },
  { id: 'myagedcare', name: 'My Aged Care', name_zh: 'My Aged Care' }
]

// Service categories
export const SERVICE_CATEGORIES = [
  { id: 'cleaning', name: 'Cleaning', name_zh: '清洁服务', icon: '🧹' },
  { id: 'cooking', name: 'Cooking', name_zh: '烹饪服务', icon: '🍳' },
  { id: 'gardening', name: 'Gardening', name_zh: '园艺服务', icon: '🌿' },
  { id: 'personal', name: 'Personal Care', name_zh: '个人护理', icon: '🤝' },
  { id: 'maintenance', name: 'Maintenance', name_zh: '家居维修', icon: '🔧' }
]

// Booking status options
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED'
} as const

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS]

// Payment status options
export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED'
} as const

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]

// Days of week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', label_zh: '星期日', short: 'Sun' },
  { value: 1, label: 'Monday', label_zh: '星期一', short: 'Mon' },
  { value: 2, label: 'Tuesday', label_zh: '星期二', short: 'Tue' },
  { value: 3, label: 'Wednesday', label_zh: '星期三', short: 'Wed' },
  { value: 4, label: 'Thursday', label_zh: '星期四', short: 'Thu' },
  { value: 5, label: 'Friday', label_zh: '星期五', short: 'Fri' },
  { value: 6, label: 'Saturday', label_zh: '星期六', short: 'Sat' }
]

// Time slots for availability
export const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
]

// Slot names for multiple windows per day
export const SLOT_NAMES = ['Morning', 'Afternoon', 'Evening', 'Night']

// Countries supported
export const COUNTRIES = [
  { code: 'AU', name: 'Australia', name_zh: '澳大利亚', currency: 'AUD', symbol: '$', taxRate: 10 },
  { code: 'CN', name: 'China', name_zh: '中国', currency: 'CNY', symbol: '¥', taxRate: 0 },
  { code: 'CA', name: 'Canada', name_zh: '加拿大', currency: 'CAD', symbol: '$', taxRate: 13 }
]

// Languages supported
export const LANGUAGES = [
  { code: 'en', name: 'English', name_zh: '英语' },
  { code: 'zh', name: '中文', name_zh: '中文' }
]

// Certification options for providers
export const CERTIFICATION_OPTIONS = [
  'First Aid',
  'CPR',
  'NDIS Worker Orientation',
  'Dementia Care',
  'Manual Handling',
  'Food Safety',
  'Police Check',
  'Working with Children Check'
]

// Experience levels
export const EXPERIENCE_LEVELS = [
  { value: '0-1', label: 'Less than 1 year', label_zh: '少于1年' },
  { value: '1-2', label: '1–2 years', label_zh: '1-2年' },
  { value: '3-5', label: '3–5 years', label_zh: '3-5年' },
  { value: '5-10', label: '5–10 years', label_zh: '5-10年' },
  { value: '10+', label: '10+ years', label_zh: '10年以上' }
]