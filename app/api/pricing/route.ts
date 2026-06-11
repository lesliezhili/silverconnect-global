import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { serviceCategory, durationHours = 1, country = "AU", platformTier = "free" } = await req.json();
  if (!serviceCategory) return NextResponse.json({ error: "serviceCategory required" }, { status: 400 });
  const rates: Record<string, Record<string, number>> = { AU: { cleaning: 50, garden: 50, repair: 65, personalCare: 55, companion: 40, transport: 45, itSupport: 65 }, NZ: { cleaning: 45, garden: 55, repair: 70, personalCare: 50, companion: 38, transport: 42, itSupport: 60 } };
  const taxRates: Record<string, number> = { AU: 0.10, NZ: 0.15 };
  const currencies: Record<string, string> = { AU: "AUD", NZ: "NZD" };
  const platformFees: Record<string, number> = { free: 0, standard: 1.50, premium: 3.50 };
  const countryRates = rates[country] || rates["AU"];
  const baseRate = countryRates[serviceCategory] || 50;
  const basePrice = Math.round(baseRate * durationHours * 100) / 100;
  const taxRate = taxRates[country] || 0.10;
  const taxAmount = Math.round(basePrice * taxRate * 100) / 100;
  const bankFee = platformTier === "free" ? 0 : Math.round(((basePrice + taxAmount) * 0.017 + 0.30) * 100) / 100;
  const platformFee = platformFees[platformTier] || 0;
  const total = Math.round((basePrice + taxAmount + bankFee + platformFee) * 100) / 100;
  return NextResponse.json({ success: true, pricing: { country, currency: currencies[country], serviceCategory, durationHours, baseRate, basePrice, tax: { rate: taxRate, name: "GST", amount: taxAmount, label: country === "NZ" ? "15% NZ GST" : "10% AU GST" }, bankFee: { amount: bankFee }, platformFee: { amount: platformFee, tier: platformTier }, total, formatted: (country === "NZ" ? "NZ$" : "A$") + total.toFixed(2) } });
}
export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country") || "AU";
  const rates: Record<string, Record<string, { rate: number; name: string }>> = { AU: { cleaning: { rate: 50, name: "Home Cleaning" }, garden: { rate: 50, name: "Garden" }, repair: { rate: 65, name: "Repairs" }, personalCare: { rate: 55, name: "Personal Care" }, companion: { rate: 40, name: "Companionship" }, transport: { rate: 45, name: "Transport" }, itSupport: { rate: 65, name: "IT Support" } }, NZ: { cleaning: { rate: 45, name: "Home Cleaning" }, garden: { rate: 55, name: "Garden" }, repair: { rate: 70, name: "Repairs" }, personalCare: { rate: 50, name: "Personal Care" }, companion: { rate: 38, name: "Companionship" }, transport: { rate: 42, name: "Transport" }, itSupport: { rate: 60, name: "IT Support" } } };
  return NextResponse.json({ success: true, country, currency: country === "NZ" ? "NZD" : "AUD", taxRate: country === "NZ" ? 0.15 : 0.10, services: rates[country] || rates["AU"] });
}
