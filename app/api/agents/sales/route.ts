import { NextResponse } from "next/server";
import { DEFAULT_SALES_CONFIG, SALES_AGENT_CAPABILITIES } from "@/lib/agents/sales";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    agent: "sales-agent",
    status: "active",
    version: "1.0.0",
    capabilities: SALES_AGENT_CAPABILITIES,
    config: {
      emailProvider: DEFAULT_SALES_CONFIG.emailProvider,
      referralReward: `${DEFAULT_SALES_CONFIG.referralRewardAmount} ${DEFAULT_SALES_CONFIG.referralRewardCurrency}`,
      analyticsEnabled: DEFAULT_SALES_CONFIG.analyticsEnabled,
    },
    uptime: process.uptime(),
  });
}
