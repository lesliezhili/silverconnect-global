import { supabase } from './supabase'

export interface Service {
  id: string
  category: string
  name: string
  name_zh: string
  description: string
  description_zh: string
  duration_minutes: number
  image_url: string
  is_active: boolean
}

export interface ServiceWithPrice extends Service {
  base_price: number
  price_with_tax: number
  currency_symbol: string
}

// Australia services data
export const SERVICES_AU = [
  {
    id: '1',
    category: 'cleaning',
    name: 'Standard Home Cleaning',
    name_zh: '标准家庭清洁',
    description: 'Complete home cleaning including dusting, vacuuming, mopping all rooms',
    description_zh: '完整的家庭清洁，包括除尘、吸尘、拖地',
    duration_minutes: 120,
    image_url: '/images/cleaning.jpg',
    base_price: 60,
    price_with_tax: 66
  },
  {
    id: '2',
    category: 'cleaning',
    name: 'Deep Cleaning',
    name_zh: '深度清洁',
    description: 'Thorough 4-hour deep clean including appliances, windows, and hard-to-reach areas',
    description_zh: '4小时深度清洁，包括电器、窗户和难以触及的区域',
    duration_minutes: 240,
    image_url: '/images/deep-cleaning.jpg',
    base_price: 120,
    price_with_tax: 132
  },
  {
    id: '3',
    category: 'cleaning',
    name: 'Window Cleaning',
    name_zh: '窗户清洁',
    description: 'Professional interior and exterior window cleaning',
    description_zh: '专业的室内外窗户清洁',
    duration_minutes: 90,
    image_url: '/images/window-cleaning.jpg',
    base_price: 80,
    price_with_tax: 88
  },
  {
    id: '4',
    category: 'cooking',
    name: 'Weekly Meal Prep',
    name_zh: '每周备餐',
    description: "5 days of healthy, pre-portioned meals with reheating instructions",
    description_zh: '5天健康、分份的餐食，附加热说明',
    duration_minutes: 180,
    image_url: '/images/meal-prep.jpg',
    base_price: 85,
    price_with_tax: 93.50
  },
  {
    id: '5',
    category: 'cooking',
    name: 'Daily Home Cooking',
    name_zh: '每日家常烹饪',
    description: 'Fresh daily meals prepared in your kitchen',
    description_zh: '在您的厨房准备新鲜的家常餐食',
    duration_minutes: 60,
    image_url: '/images/cooking.jpg',
    base_price: 45,
    price_with_tax: 49.50
  },
  {
    id: '6',
    category: 'gardening',
    name: 'Lawn Mowing & Edging',
    name_zh: '草坪修剪',
    description: 'Professional lawn care including mowing, edging, and blowing',
    description_zh: '专业的草坪护理，包括修剪、修边和吹扫',
    duration_minutes: 60,
    image_url: '/images/lawn-mowing.jpg',
    base_price: 50,
    price_with_tax: 55
  },
  {
    id: '7',
    category: 'gardening',
    name: 'Complete Garden Tidy',
    name_zh: '花园整理',
    description: 'Weeding, pruning, leaf removal, and general garden maintenance',
    description_zh: '除草、修剪、清理树叶和一般花园维护',
    duration_minutes: 120,
    image_url: '/images/garden-tidy.jpg',
    base_price: 95,
    price_with_tax: 104.50
  },
  {
    id: '8',
    category: 'personal',
    name: 'Shopping Assistant',
    name_zh: '购物助手',
    description: 'Grocery shopping, errands, and delivery to your home',
    description_zh: '杂货购物、跑腿和送货上门',
    duration_minutes: 60,
    image_url: '/images/shopping.jpg',
    base_price: 35,
    price_with_tax: 38.50
  },
  {
    id: '9',
    category: 'personal',
    name: 'Companionship Visit',
    name_zh: '陪伴探访',
    description: 'Social visit, conversation, and wellness check',
    description_zh: '社交拜访、交谈和健康检查',
    duration_minutes: 120,
    image_url: '/images/companionship.jpg',
    base_price: 40,
    price_with_tax: 44
  },
  {
    id: '10',
    category: 'personal',
    name: 'Transport to Appointments',
    name_zh: '交通服务',
    description: 'Safe transport to medical appointments, shopping, or social outings',
    description_zh: '安全接送至医疗预约、购物或社交活动',
    duration_minutes: 60,
    image_url: '/images/transport.jpg',
    base_price: 50,
    price_with_tax: 55
  },
  {
    id: '11',
    category: 'maintenance',
    name: 'Handyman Services',
    name_zh: '杂工服务',
    description: 'Small home repairs: fixing leaks, hanging pictures, assembly',
    description_zh: '小型家居维修：修复漏水、挂画、组装家具',
    duration_minutes: 60,
    image_url: '/images/handyman.jpg',
    base_price: 70,
    price_with_tax: 77
  },
  {
    id: '12',
    category: 'maintenance',
    name: 'Gutter Cleaning',
    name_zh: '排水沟清洁',
    description: 'Safe single-story gutter cleaning and downspout check',
    description_zh: '安全的单层排水沟清洁和落水管检查',
    duration_minutes: 90,
    image_url: '/images/gutter-cleaning.jpg',
    base_price: 80,
    price_with_tax: 88
  }
]

// China services data
export const SERVICES_CN = [
  {
    id: '1',
    category: 'cleaning',
    name: 'Standard Home Cleaning',
    name_zh: '标准家庭清洁',
    description: 'Complete home cleaning including dusting, vacuuming, mopping all rooms',
    description_zh: '完整的家庭清洁，包括除尘、吸尘、拖地',
    duration_minutes: 120,
    image_url: '/images/cleaning.jpg',
    base_price: 280,
    price_with_tax: 280
  },
  {
    id: '2',
    category: 'cleaning',
    name: 'Deep Cleaning',
    name_zh: '深度清洁',
    description: 'Thorough 4-hour deep clean including appliances, windows',
    description_zh: '4小时深度清洁，包括电器、窗户',
    duration_minutes: 240,
    image_url: '/images/deep-cleaning.jpg',
    base_price: 560,
    price_with_tax: 560
  },
  {
    id: '4',
    category: 'cooking',
    name: 'Weekly Meal Prep',
    name_zh: '每周备餐',
    description: "5 days of healthy, pre-portioned meals",
    description_zh: '5天健康、分份的餐食',
    duration_minutes: 180,
    image_url: '/images/meal-prep.jpg',
    base_price: 400,
    price_with_tax: 400
  },
  {
    id: '6',
    category: 'gardening',
    name: 'Lawn Mowing & Edging',
    name_zh: '草坪修剪',
    description: 'Professional lawn care including mowing, edging',
    description_zh: '专业的草坪护理，包括修剪、修边',
    duration_minutes: 60,
    image_url: '/images/lawn-mowing.jpg',
    base_price: 235,
    price_with_tax: 235
  }
]

// Canada services data
export const SERVICES_CA = [
  {
    id: '1',
    category: 'cleaning',
    name: 'Standard Home Cleaning',
    name_zh: '标准家庭清洁',
    description: 'Complete home cleaning including dusting, vacuuming, mopping all rooms',
    description_zh: '完整的家庭清洁，包括除尘、吸尘、拖地',
    duration_minutes: 120,
    image_url: '/images/cleaning.jpg',
    base_price: 55,
    price_with_tax: 62.15
  },
  {
    id: '2',
    category: 'cleaning',
    name: 'Deep Cleaning',
    name_zh: '深度清洁',
    description: 'Thorough 4-hour deep clean including appliances, windows',
    description_zh: '4小时深度清洁，包括电器、窗户',
    duration_minutes: 240,
    image_url: '/images/deep-cleaning.jpg',
    base_price: 110,
    price_with_tax: 124.30
  },
  {
    id: '12',
    category: 'maintenance',
    name: 'Snow Shoveling',
    name_zh: '铲雪服务',
    description: 'Driveway and walkway snow removal',
    description_zh: '车道和人行道除雪',
    duration_minutes: 60,
    image_url: '/images/snow-shoveling.jpg',
    base_price: 40,
    price_with_tax: 45.20
  }
]

// Get services by country code
export function getServicesByCountry(countryCode: string): any[] {
  switch (countryCode) {
    case 'AU':
      return SERVICES_AU
    case 'CN':
      return SERVICES_CN
    case 'CA':
      return SERVICES_CA
    default:
      return SERVICES_AU
  }
}

export async function getAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })

  if (error) return []
  return data || []
}

export async function getServicesByCategory(category: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)

  if (error) return []
  return data || []
}

export async function getServiceWithPrice(serviceId: string, countryCode: string): Promise<ServiceWithPrice | null> {
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single()

  if (!service) return null

  const { data: price } = await supabase
    .from('service_prices')
    .select('*, countries(*)')
    .eq('service_id', serviceId)
    .eq('country_code', countryCode)
    .single()

  return {
    ...service,
    base_price: price?.base_price || 0,
    price_with_tax: price?.price_with_tax || 0,
    currency_symbol: price?.countries?.currency_symbol || '$'
  }
}

export async function getServiceCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('services')
    .select('category')
    .eq('is_active', true)

  if (error) return []
  return [...new Set(data.map(s => s.category))]
}

// Featured services for homepage
export const FEATURED_SERVICES = SERVICES_AU.slice(0, 6)

// Popular services based on bookings
export async function getPopularServices(limit: number = 6): Promise<Service[]> {
  const services = await getAllServices()
  return services.slice(0, limit)
}