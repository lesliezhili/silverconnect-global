import type { CountryCode } from "@/components/layout";
import { CURRENCY_SYMBOL } from "@/components/domain/country";

export type JobStatus =
  | "pending"
  | "accepted"
  | "enRoute"
  | "inProgress"
  | "completed"
  | "cancelled"
  | "declined";

export interface ProviderJob {
  id: string;
  customerName: string;
  customerInitials: string;
  serviceKey: "cleaning" | "cooking" | "garden" | "personalCare" | "repair";
  startISO: string;
  durationMin: number;
  addressLine: string;
  distanceKm: number;
  phone: string;
  notes?: string;
  basePrice: number;
  weekendBonus?: number;
  tip?: number;
  status: JobStatus;
}

export interface ProviderReview {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  customerInitials: string;
  customerName: string;
  dateISO: string;
  reply?: string;
}

const today = new Date();
function addHours(h: number) {
  const d = new Date(today);
  d.setHours(today.getHours() + h, 0, 0, 0);
  return d.toISOString();
}
function addDays(days: number, hour = 9) {
  const d = new Date(today);
  d.setDate(today.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const MOCK_JOBS: ProviderJob[] = [
  {
    id: "J-1042",
    customerName: "Margaret Chen",
    customerInitials: "MC",
    serviceKey: "cleaning",
    startISO: addHours(2),
    durationMin: 180,
    addressLine: "12 Park St, Chatswood NSW",
    distanceKm: 3.4,
    phone: "+61 412 000 111",
    notes: "Please ring the doorbell twice. Cat in the back room.",
    basePrice: 165,
    weekendBonus: 0,
    tip: 0,
    status: "accepted",
  },
  {
    id: "J-1043",
    customerName: "George Liu",
    customerInitials: "GL",
    serviceKey: "personalCare",
    startISO: addHours(6),
    durationMin: 120,
    addressLine: "44 King Rd, Hornsby NSW",
    distanceKm: 7.1,
    phone: "+61 412 222 333",
    basePrice: 140,
    status: "pending",
  },
  {
    id: "J-1044",
    customerName: "Helen Tan",
    customerInitials: "HT",
    serviceKey: "cooking",
    startISO: addDays(1, 11),
    durationMin: 90,
    addressLine: "9 Albert St, Eastwood NSW",
    distanceKm: 5.0,
    phone: "+61 412 444 555",
    basePrice: 70,
    status: "pending",
  },
  {
    id: "J-1045",
    customerName: "Robert Wang",
    customerInitials: "RW",
    serviceKey: "garden",
    startISO: addDays(2, 9),
    durationMin: 240,
    addressLine: "21 Forest Ave, Epping NSW",
    distanceKm: 8.2,
    phone: "+61 412 666 777",
    basePrice: 200,
    weekendBonus: 30,
    status: "pending",
  },
  {
    id: "J-1041",
    customerName: "Sarah Kim",
    customerInitials: "SK",
    serviceKey: "cleaning",
    startISO: addDays(-1, 14),
    durationMin: 180,
    addressLine: "5 Lawson St, Ryde NSW",
    distanceKm: 2.0,
    phone: "+61 412 888 999",
    basePrice: 165,
    status: "completed",
  },
  {
    id: "J-1040",
    customerName: "Daniel Lee",
    customerInitials: "DL",
    serviceKey: "repair",
    startISO: addDays(-3, 10),
    durationMin: 60,
    addressLine: "33 Beach Rd, Manly NSW",
    distanceKm: 12.0,
    phone: "+61 412 121 212",
    basePrice: 60,
    status: "completed",
  },
];

export const MOCK_REVIEWS: ProviderReview[] = [
  {
    id: "R-1",
    rating: 5,
    comment: "Margaret was on time and very thorough. Will book again.",
    customerName: "Sarah Kim",
    customerInitials: "SK",
    dateISO: addDays(-1, 16),
    reply: "Thank you so much! Looking forward to the next visit.",
  },
  {
    id: "R-2",
    rating: 5,
    comment: "Friendly and professional. My mum was happy.",
    customerName: "Daniel Lee",
    customerInitials: "DL",
    dateISO: addDays(-3, 18),
  },
  {
    id: "R-3",
    rating: 4,
    comment: "Good work but arrived 10 minutes late.",
    customerName: "Helen Tan",
    customerInitials: "HT",
    dateISO: addDays(-7, 12),
  },
  {
    id: "R-4",
    rating: 5,
    comment: "Excellent. Cleaned places I forgot existed.",
    customerName: "George Liu",
    customerInitials: "GL",
    dateISO: addDays(-10, 9),
  },
  {
    id: "R-5",
    rating: 3,
    comment: "OK overall. The kitchen could have been better.",
    customerName: "Robert Wang",
    customerInitials: "RW",
    dateISO: addDays(-14, 14),
  },
];

export function jobTotal(j: ProviderJob): number {
  return j.basePrice + (j.weekendBonus ?? 0) + (j.tip ?? 0);
}

export function priceCountry(country: CountryCode, value: number): string {
  const sym = CURRENCY_SYMBOL[country];
  const v = country === "CN" ? value * 8 : value;
  return `${sym}${v.toFixed(0)}`;
}

export function reviewStats(reviews: ProviderReview[]) {
  const n = reviews.length;
  if (n === 0) return { avg: 0, n: 0, pct: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const positive = reviews.filter((r) => r.rating >= 4).length;
  return { avg: sum / n, n, pct: Math.round((positive / n) * 100) };
}
