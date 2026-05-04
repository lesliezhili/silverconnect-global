export type DisputeStatus = "open" | "review" | "resolved" | "rejected";
export type DisputeType = "notShow" | "incomplete" | "damage" | "other";

export interface AdminDispute {
  id: string;
  bookingId: string;
  customerName: string;
  providerName: string;
  type: DisputeType;
  amount: number;
  country: "AU" | "CN" | "CA";
  status: DisputeStatus;
  submittedISO: string;
  slaHours: number;
  description: string;
}

export type SafetyLevel = "low" | "mid" | "high";
export type SafetyStatus = "open" | "investigating" | "closed";

export interface AdminSafetyEvent {
  id: string;
  reporterName: string;
  reportedName: string;
  level: SafetyLevel;
  status: SafetyStatus;
  description: string;
  submittedISO: string;
  country: "AU" | "CN" | "CA";
}

export type ProviderApprovalStatus =
  | "pending"
  | "docsReview"
  | "background"
  | "stripe"
  | "approved"
  | "rejected";

export interface AdminProvider {
  id: string;
  name: string;
  country: "AU" | "CN" | "CA";
  appliedISO: string;
  step: number;
  status: ProviderApprovalStatus;
  missingDocs?: string[];
}

export interface AdminRefund {
  id: string;
  bookingId: string;
  customerName: string;
  amount: number;
  reason: "dispute" | "selfService";
  requestedISO: string;
  status: "queued" | "processing" | "done" | "failed";
}

const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const hr = (n: number) => new Date(Date.now() - n * 3600000).toISOString();

export const MOCK_DISPUTES: AdminDispute[] = [
  {
    id: "D-2031",
    bookingId: "B-1099",
    customerName: "Margaret Chen",
    providerName: "Helen Li",
    type: "incomplete",
    amount: 165,
    country: "AU",
    status: "open",
    submittedISO: hr(3),
    slaHours: 45,
    description: "Provider only cleaned the kitchen, left bathroom untouched.",
  },
  {
    id: "D-2030",
    bookingId: "B-1080",
    customerName: "George Liu",
    providerName: "Wei Tan",
    type: "notShow",
    amount: 140,
    country: "AU",
    status: "review",
    submittedISO: hr(20),
    slaHours: 28,
    description: "Provider didn't show up. Customer waited 1 hour.",
  },
  {
    id: "D-2029",
    bookingId: "B-1075",
    customerName: "Helen Tan",
    providerName: "Sarah Kim",
    type: "damage",
    amount: 70,
    country: "AU",
    status: "open",
    submittedISO: hr(40),
    slaHours: 8,
    description: "Vase broken during cleaning. Photos attached.",
  },
  {
    id: "D-2028",
    bookingId: "B-1060",
    customerName: "Robert Wang",
    providerName: "Daniel Lee",
    type: "other",
    amount: 200,
    country: "CN",
    status: "resolved",
    submittedISO: day(3),
    slaHours: 0,
    description: "Already resolved with full refund.",
  },
];

export const MOCK_SAFETY: AdminSafetyEvent[] = [
  {
    id: "S-501",
    reporterName: "Margaret Chen",
    reportedName: "Helen Li",
    level: "high",
    status: "open",
    description: "Verbal threats during a service visit.",
    submittedISO: hr(1),
    country: "AU",
  },
  {
    id: "S-500",
    reporterName: "George Liu",
    reportedName: "Wei Tan",
    level: "mid",
    status: "investigating",
    description: "Provider made customer uncomfortable with personal questions.",
    submittedISO: hr(18),
    country: "AU",
  },
  {
    id: "S-499",
    reporterName: "Sarah Kim",
    reportedName: "Daniel Lee",
    level: "low",
    status: "closed",
    description: "Provider was 30 min late and unprofessional. Resolved with warning.",
    submittedISO: day(2),
    country: "AU",
  },
];

export const MOCK_PROVIDERS: AdminProvider[] = [
  {
    id: "P-101",
    name: "Yuki Tanaka",
    country: "AU",
    appliedISO: day(1),
    step: 2,
    status: "docsReview",
    missingDocs: ["insurance"],
  },
  {
    id: "P-102",
    name: "陈 强",
    country: "CN",
    appliedISO: day(2),
    step: 3,
    status: "background",
  },
  {
    id: "P-103",
    name: "Marie Dubois",
    country: "CA",
    appliedISO: day(3),
    step: 1,
    status: "pending",
  },
  {
    id: "P-104",
    name: "Anna Schmidt",
    country: "AU",
    appliedISO: day(5),
    step: 4,
    status: "stripe",
  },
  {
    id: "P-105",
    name: "Raj Kumar",
    country: "AU",
    appliedISO: day(7),
    step: 5,
    status: "approved",
  },
];

export const MOCK_REFUNDS: AdminRefund[] = [
  {
    id: "R-901",
    bookingId: "B-1099",
    customerName: "Margaret Chen",
    amount: 165,
    reason: "dispute",
    requestedISO: hr(2),
    status: "queued",
  },
  {
    id: "R-900",
    bookingId: "B-1075",
    customerName: "Helen Tan",
    amount: 70,
    reason: "dispute",
    requestedISO: hr(40),
    status: "processing",
  },
  {
    id: "R-898",
    bookingId: "B-1060",
    customerName: "Robert Wang",
    amount: 200,
    reason: "selfService",
    requestedISO: day(3),
    status: "done",
  },
];

export const ADMIN_KPI = {
  newOrdersToday: 47,
  openDisputes: 3,
  pendingProviders: 4,
  safetyEvents: 1,
  gmvWeek: 24850,
  aiResolutionRate: 0.78,
};

export const ADMIN_ALERTS: { key: string; severity: "warn" | "danger" }[] = [
  { key: "alertWebhookLag", severity: "warn" },
];

export const ANALYTICS_WEEKLY_ORDERS = [
  { country: "AU", values: [38, 42, 47, 51, 49, 55, 47] },
  { country: "CN", values: [12, 14, 18, 16, 21, 19, 22] },
  { country: "CA", values: [8, 9, 11, 10, 12, 14, 13] },
];

export const ANALYTICS_KPIS = {
  reorderRate: 0.62,
  avgRating: 4.7,
  disputeRate: 0.018,
  aiResolutionRate: 0.78,
  paymentSuccess: 0.992,
};
