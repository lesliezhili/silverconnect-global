// lib/providers.ts
export interface Provider {
  id: string;
  name: string;
  serviceCategories: string[];
  postcode: string;
  rating: number;
  available: boolean;
  avatarInitials: string;
  role: string;
  isChristian?: boolean;
  isVerified?: boolean;
  services?: string[];
  experienceYears?: number;
  isFeatured?: boolean;
  ndisRegistered?: boolean;
}

// Mock providers for development
export const PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Sarah\'s Senior Care',
    serviceCategories: ['cleaning', 'personal care'],
    postcode: '3000',
    rating: 4.8,
    available: true,
    avatarInitials: 'SC',
    role: 'Care Provider',
    isChristian: true,
    isVerified: true,
    services: ['cleaning', 'personal care'],
    experienceYears: 8,
    isFeatured: true,
    ndisRegistered: false
  },
  {
    id: '2',
    name: 'James Maintenance',
    serviceCategories: ['maintenance', 'gardening'],
    postcode: '3000',
    rating: 4.9,
    available: true,
    avatarInitials: 'JM',
    role: 'Maintenance Specialist',
    isChristian: false,
    isVerified: true,
    services: ['maintenance', 'gardening'],
    experienceYears: 12,
    isFeatured: false,
    ndisRegistered: false
  },
  {
    id: '3',
    name: 'Caring Hands',
    serviceCategories: ['care', 'companionship'],
    postcode: '3000',
    rating: 4.7,
    available: true,
    avatarInitials: 'CH',
    role: 'Companion Care',
    isChristian: true,
    isVerified: true,
    services: ['care', 'companionship'],
    experienceYears: 6,
    isFeatured: false,
    ndisRegistered: true
  }
];

export function getProvidersByCategory(category: string): Provider[] {
  return PROVIDERS.filter(p => p.serviceCategories.includes(category));
}

export function getProviderById(id: string): Provider | undefined {
  return PROVIDERS.find(p => p.id === id);
}