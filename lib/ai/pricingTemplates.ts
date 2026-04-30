// AI-driven pricing templates for different service categories

export interface PricingTemplate {
  id: string
  name: string
  category: string
  baseRate: number
  hourlyRate: number
  weekendMultiplier: number
  holidayMultiplier: number
  nightMultiplier: number
  bulkDiscount: {
    enabled: boolean
    hoursThreshold: number
    discountPercentage: number
  }
}

export const pricingTemplates: PricingTemplate[] = [
  {
    id: 'cleaning_standard',
    name: 'Standard Cleaning',
    category: 'cleaning',
    baseRate: 60,
    hourlyRate: 30,
    weekendMultiplier: 1.2,
    holidayMultiplier: 1.5,
    nightMultiplier: 1.3,
    bulkDiscount: {
      enabled: true,
      hoursThreshold: 4,
      discountPercentage: 10
    }
  },
  {
    id: 'cleaning_deep',
    name: 'Deep Cleaning',
    category: 'cleaning',
    baseRate: 120,
    hourlyRate: 40,
    weekendMultiplier: 1.2,
    holidayMultiplier: 1.5,
    nightMultiplier: 1.3,
    bulkDiscount: {
      enabled: true,
      hoursThreshold: 4,
      discountPercentage: 10
    }
  },
  {
    id: 'cooking_meal_prep',
    name: 'Meal Preparation',
    category: 'cooking',
    baseRate: 85,
    hourlyRate: 35,
    weekendMultiplier: 1.1,
    holidayMultiplier: 1.4,
    nightMultiplier: 1.2,
    bulkDiscount: {
      enabled: true,
      hoursThreshold: 5,
      discountPercentage: 8
    }
  },
  {
    id: 'gardening_maintenance',
    name: 'Garden Maintenance',
    category: 'gardening',
    baseRate: 50,
    hourlyRate: 25,
    weekendMultiplier: 1.2,
    holidayMultiplier: 1.5,
    nightMultiplier: 1.2,
    bulkDiscount: {
      enabled: true,
      hoursThreshold: 3,
      discountPercentage: 5
    }
  },
  {
    id: 'personal_care',
    name: 'Personal Care',
    category: 'personal',
    baseRate: 40,
    hourlyRate: 20,
    weekendMultiplier: 1.15,
    holidayMultiplier: 1.4,
    nightMultiplier: 1.25,
    bulkDiscount: {
      enabled: false,
      hoursThreshold: 0,
      discountPercentage: 0
    }
  },
  {
    id: 'maintenance_handyman',
    name: 'Handyman Services',
    category: 'maintenance',
    baseRate: 70,
    hourlyRate: 35,
    weekendMultiplier: 1.25,
    holidayMultiplier: 1.6,
    nightMultiplier: 1.35,
    bulkDiscount: {
      enabled: true,
      hoursThreshold: 4,
      discountPercentage: 8
    }
  }
]

export function getPricingTemplate(category: string): PricingTemplate | undefined {
  return pricingTemplates.find(t => t.category === category)
}

export function calculateDynamicPrice(
  template: PricingTemplate,
  hours: number,
  isWeekend: boolean,
  isHoliday: boolean,
  isNight: boolean,
  hoursThreshold?: number
): number {
  let multiplier = 1.0
  if (isHoliday) multiplier *= template.holidayMultiplier
  else if (isWeekend) multiplier *= template.weekendMultiplier
  if (isNight) multiplier *= template.nightMultiplier

  let price = template.hourlyRate * hours * multiplier

  if (template.bulkDiscount.enabled && hours >= (hoursThreshold || template.bulkDiscount.hoursThreshold)) {
    price = price * (1 - template.bulkDiscount.discountPercentage / 100)
  }

  return Math.round(price * 100) / 100
}