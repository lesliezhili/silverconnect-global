// lib/types.ts

// Service categories
export type ServiceCategory = 
  | 'cleaning'
  | 'gardening'
  | 'personal-care'
  | 'maintenance'
  | 'companionship'
  | 'shopping'
  | 'transport'
  | 'nursing'
  | 'meal-prep'
  | 'emergency';

// Funding options for seniors (Australian context)
export const FUNDING_OPTIONS = [
  { type: 'HCP', label: 'Home Care Package', description: 'Federal government funding for aged care', monthlySubsidy: 2000 },
  { type: 'CHSP', label: 'Commonwealth Home Support Programme', description: 'Basic home help services', monthlySubsidy: 800 },
  { type: 'PRIVATE', label: 'Private Payment', description: 'Self-funded care services', monthlySubsidy: 0 },
  { type: 'DVA', label: 'Department of Veterans\' Affairs', description: 'Veterans\' care funding', monthlySubsidy: 1500 },
  { type: 'NDIS', label: 'NDIS (for under 65)', description: 'National Disability Insurance Scheme', monthlySubsidy: 2500 },
  { type: 'STCA', label: 'Short-Term Restorative Care', description: 'Temporary intensive care', monthlySubsidy: 3000 },
  { type: 'TRANSITION', label: 'Transition Care Programme', description: 'Hospital to home transition', monthlySubsidy: 2500 }
] as const;

export type FundingOption = typeof FUNDING_OPTIONS[number]['type'];

// Service interface
export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  duration: number; // in minutes
  basePrice: number;
  taxRate: number;
  requiresAssessment: boolean;
  popularForSeniors: boolean;
}

// Booking interface
export interface Booking {
  id: string;
  serviceId: string;
  seniorId: string;
  providerId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
  fundingSource: FundingOption;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  specialInstructions?: string;
  createdAt: string;
}

// Senior/User interface
export interface Senior {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  postcode: string;
  fundingPackage?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalConditions?: string[];
  preferredLanguage: 'en' | 'zh' | 'fr';
  createdAt: string;
}

// Provider interface
export interface Provider {
  id: string;
  name: string;
  abn: string;
  services: ServiceCategory[];
  postcodes: string[];
  rating: number;
  verified: boolean;
  languages: string[];
  phone: string;
  email: string;
  avatarInitials: string;
}

// Country configuration
export interface CountryConfig {
  code: 'AU' | 'CN' | 'CA';
  name: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  taxName: string;
  emergencyNumber: string;
  language: string;
}

// Location types for Victoria, Australia
export interface Location {
  postcode: string;
  suburb: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

// Assessment required for certain services
export interface Assessment {
  id: string;
  seniorId: string;
  serviceId: string;
  date: string;
  assessor: string;
  recommendations: string[];
  approved: boolean;
  notes: string;
}

// Review/Rating interface
export interface Review {
  id: string;
  bookingId: string;
  seniorId: string;
  providerId: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

// Helper functions
export function formatCurrency(amount: number, countryCode: 'AU' | 'CN' | 'CA'): string {
  const symbols = { AU: 'A$', CN: '¥', CA: 'C$' };
  return `${symbols[countryCode]}${amount.toFixed(2)}`;
}

export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100);
}

export function getTotalWithTax(amount: number, taxRate: number): number {
  return amount + calculateTax(amount, taxRate);
}

// Senior-friendly service recommendations based on common needs
export const SENIOR_SERVICES = {
  cleaning: {
    name: 'Home Cleaning',
    description: 'Light housekeeping, vacuuming, dusting, and bathroom cleaning',
    seniorFriendly: true
  },
  'personal-care': {
    name: 'Personal Care',
    description: 'Bathing, dressing, grooming, and toileting assistance',
    seniorFriendly: true
  },
  companionship: {
    name: 'Social Support',
    description: 'Friendly visits, conversation, and social activities',
    seniorFriendly: true
  },
  'meal-prep': {
    name: 'Meal Preparation',
    description: 'Nutritious meal planning and cooking',
    seniorFriendly: true
  },
  transport: {
    name: 'Transport',
    description: 'Medical appointments, shopping, and social outings',
    seniorFriendly: true
  }
};

// Emergency alert levels
export enum EmergencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Notification preferences
export interface NotificationPreferences {
  sms: boolean;
  email: boolean;
  emergencyAlerts: boolean;
  appointmentReminders: boolean;
  familyUpdates: boolean;
}