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

export interface AdminCustomer {
  id: string;
  name: string;
  initials: string;
  email: string;
  country: "AU" | "CN" | "CA";
  registeredISO: string;
  bookings: number;
  lifetimeSpend: number;
  riskFlags: string[];
}

export const MOCK_CUSTOMERS: AdminCustomer[] = [
  { id: "C-301", name: "Margaret Chen", initials: "MC", email: "margaret@example.com", country: "AU", registeredISO: day(180), bookings: 24, lifetimeSpend: 3960, riskFlags: [] },
  { id: "C-302", name: "George Liu", initials: "GL", email: "george@example.com", country: "AU", registeredISO: day(120), bookings: 12, lifetimeSpend: 1680, riskFlags: ["chargeback"] },
  { id: "C-303", name: "Helen Tan", initials: "HT", email: "helen@example.com", country: "AU", registeredISO: day(60), bookings: 8, lifetimeSpend: 560, riskFlags: [] },
  { id: "C-304", name: "李 强", initials: "李", email: "li@example.cn", country: "CN", registeredISO: day(30), bookings: 4, lifetimeSpend: 1200, riskFlags: [] },
];

export type AdminBookingStatus = "unconfirmed" | "inEscrow" | "released" | "rescheduled";

export interface AdminBooking {
  id: string;
  customerName: string;
  providerName: string;
  amount: number;
  status: AdminBookingStatus;
  createdISO: string;
  flag?: "stuck" | "escrow" | "rescheduled";
}

export const MOCK_BOOKINGS_FEED: AdminBooking[] = [
  { id: "B-1099", customerName: "Margaret Chen", providerName: "Helen Li", amount: 165, status: "inEscrow", createdISO: hr(0.05), flag: "escrow" },
  { id: "B-1098", customerName: "George Liu", providerName: "Wei Tan", amount: 140, status: "unconfirmed", createdISO: hr(1.2), flag: "stuck" },
  { id: "B-1097", customerName: "Helen Tan", providerName: "Sarah Kim", amount: 70, status: "rescheduled", createdISO: hr(2), flag: "rescheduled" },
  { id: "B-1096", customerName: "Robert Wang", providerName: "Daniel Lee", amount: 200, status: "released", createdISO: hr(4) },
];

export interface AdminAiConv {
  id: string;
  user: string;
  intent: string;
  resolved: boolean;
  escalated: boolean;
  emergency: boolean;
  rating?: 1 | 2 | 3 | 4 | 5;
  startedISO: string;
  transcript: { who: "user" | "ai"; text: string }[];
}

export const MOCK_AI_CONVS: AdminAiConv[] = [
  {
    id: "AI-501",
    user: "Margaret Chen",
    intent: "reschedule",
    resolved: true,
    escalated: false,
    emergency: false,
    rating: 5,
    startedISO: hr(2),
    transcript: [
      { who: "user", text: "Can I move tomorrow's cleaning to Friday?" },
      { who: "ai", text: "I can help with that. Friday at 9 AM works for Helen Li. Confirm?" },
      { who: "user", text: "Yes please." },
      { who: "ai", text: "Done. You'll get a confirmation email." },
    ],
  },
  {
    id: "AI-500",
    user: "George Liu",
    intent: "complaint",
    resolved: false,
    escalated: true,
    emergency: false,
    rating: 2,
    startedISO: hr(20),
    transcript: [
      { who: "user", text: "The provider didn't show up." },
      { who: "ai", text: "I'm sorry. Let me escalate this to a human agent who can issue a refund." },
    ],
  },
  {
    id: "AI-499",
    user: "Anonymous",
    intent: "emergency",
    resolved: false,
    escalated: true,
    emergency: true,
    startedISO: hr(0.5),
    transcript: [
      { who: "user", text: "Help my mom fell" },
      { who: "ai", text: "Calling 000 now. Stay on the line." },
    ],
  },
];

export interface AdminKbEntry {
  id: string;
  title: string;
  country: "AU" | "CN" | "CA" | "all";
  lang: "en" | "zh";
  body: string;
}

export const MOCK_KB: AdminKbEntry[] = [
  { id: "K-1", title: "How to reschedule", country: "all", lang: "en", body: "To reschedule, open the booking and tap Reschedule. We need 24 h notice for free changes." },
  { id: "K-2", title: "如何改期", country: "all", lang: "zh", body: "在订单页点击「改期」即可。请提前 24 小时操作以免收取费用。" },
  { id: "K-3", title: "Refund policy AU", country: "AU", lang: "en", body: "Full refund within 24 h of booking. After that, 50% if cancelled before service." },
];

export const PLATFORM_FEES: Record<"AU" | "CN" | "CA", number> = {
  AU: 0.18,
  CN: 0.22,
  CA: 0.18,
};

export const EMERGENCY_KEYWORDS = ["emergency", "fell", "chest pain", "ambulance", "急救", "倒下"];

export interface AdminReviewReport {
  id: string;
  reviewId: string;
  reviewBody: string;
  reviewAuthor: string;
  reportedBy: string;
  reason: "spam" | "offensive" | "false" | "other";
  submittedISO: string;
}

export const MOCK_REVIEW_REPORTS: AdminReviewReport[] = [
  {
    id: "RR-1",
    reviewId: "R-3",
    reviewBody: "Good work but arrived 10 minutes late.",
    reviewAuthor: "Helen Tan",
    reportedBy: "Wei Tan (provider)",
    reason: "false",
    submittedISO: hr(4),
  },
  {
    id: "RR-2",
    reviewId: "R-99",
    reviewBody: "[redacted — flagged language]",
    reviewAuthor: "Anonymous",
    reportedBy: "Helen Li (provider)",
    reason: "offensive",
    submittedISO: hr(20),
  },
];
