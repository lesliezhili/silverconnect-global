export interface ServiceItem {
  id: string
  icon: string
  name: string
  description: string
  basePrice: number
  rating: number
  badge?: string
}

export const SERVICES_AU: ServiceItem[] = [
  { id: 's1',  icon: '🧹', name: 'Home cleaning',        description: 'Regular, deep clean & spring clean',   basePrice: 60, rating: 4.90 },
  { id: 's2',  icon: '🌿', name: 'Garden care',           description: 'Mowing, weeding, pruning',              basePrice: 50, rating: 4.80, badge: 'Popular' },
  { id: 's3',  icon: '🛁', name: 'Personal care',         description: 'Bathing, grooming, hygiene support',    basePrice: 65, rating: 4.97 },
  { id: 's4',  icon: '💊', name: 'Medication assistance', description: 'Prompting, monitoring, blister packs',  basePrice: 55, rating: 4.96, badge: 'NDIS' },
  { id: 's5',  icon: '🚗', name: 'Transport & escort',    description: 'Hospital, shopping, social outings',    basePrice: 45, rating: 4.93 },
  { id: 's6',  icon: '🍲', name: 'Meal preparation',      description: 'Nutritious home-cooked meals',          basePrice: 40, rating: 4.91 },
  { id: 's7',  icon: '💛', name: 'Companionship',         description: 'Social visits, games, conversation',    basePrice: 40, rating: 4.95, badge: 'Loved' },
  { id: 's8',  icon: '🧘', name: 'Wellness & exercise',   description: 'Gentle physio, yoga, walks',            basePrice: 55, rating: 4.92 },
  { id: 's9',  icon: '🛒', name: 'Shopping assistance',   description: 'Grocery run with or without client',    basePrice: 35, rating: 4.88 },
  { id: 's10', icon: '🪟', name: 'Window cleaning',       description: 'Internal & external, ground floor',     basePrice: 80, rating: 4.87 },
  { id: 's11', icon: '🚿', name: 'Wound care',            description: 'Dressing changes, post-surgical care',  basePrice: 80, rating: 4.95, badge: 'RN' },
  { id: 's12', icon: '🧺', name: 'Laundry & ironing',     description: 'Washing, drying, folding, ironing',     basePrice: 45, rating: 4.90 },
]

export const SERVICES_CN: ServiceItem[] = [
  { id: 'c1', icon: '🧹', name: '居家清洁', description: '定期或深度清洁服务',   basePrice: 280, rating: 4.90 },
  { id: 'c2', icon: '🛁', name: '个人护理', description: '洗浴、梳理、日常卫生', basePrice: 310, rating: 4.97 },
  { id: 'c3', icon: '🚗', name: '接送服务', description: '医院、购物、社交出行', basePrice: 210, rating: 4.93, badge: '热门' },
  { id: 'c4', icon: '🍲', name: '营养膳食', description: '中式营养家常菜',       basePrice: 188, rating: 4.90 },
  { id: 'c5', icon: '💛', name: '陪伴关怀', description: '聊天、棋牌、情感陪伴', basePrice: 188, rating: 4.95, badge: '最受欢迎' },
  { id: 'c6', icon: '🧘', name: '健康运动', description: '太极、散步、康复训练', basePrice: 255, rating: 4.92 },
]

export const SERVICES_CA: ServiceItem[] = [
  { id: 'ca1', icon: '🧹', name: 'Home cleaning',    description: 'Regular & deep clean',              basePrice: 55, rating: 4.90 },
  { id: 'ca2', icon: '🛁', name: 'Personal care',    description: 'Bathing, grooming, hygiene support', basePrice: 60, rating: 4.97 },
  { id: 'ca3', icon: '🚗', name: 'Transport',        description: 'Appointments, errands, outings',     basePrice: 42, rating: 4.93, badge: 'Popular' },
  { id: 'ca4', icon: '🍲', name: 'Meal preparation', description: 'Canadian home-cooked meals',         basePrice: 38, rating: 4.90 },
  { id: 'ca5', icon: '💛', name: 'Companionship',    description: 'Social visits, games, conversation', basePrice: 38, rating: 4.95, badge: 'Loved' },
  { id: 'ca6', icon: '🧘', name: 'Wellness',         description: 'Gentle movement & physio support',   basePrice: 50, rating: 4.92 },
]
