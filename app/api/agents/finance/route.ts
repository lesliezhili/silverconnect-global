import { NextResponse } from "next/server";
import { DEFAULT_FINANCE_CONFIG, FINANCE_AGENT_CAPABILITIES } from "@/lib/agents/finance";
import { CHART_OF_ACCOUNTS } from "@/lib/agents/finance";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    agent: "finance-agent",
    status: "active",
    version: "1.0.0",
    capabilities: FINANCE_AGENT_CAPABILITIES,
    config: {
      baseCurrency: DEFAULT_FINANCE_CONFIG.baseCurrency,
      fiscalYearStart: DEFAULT_FINANCE_CONFIG.fiscalYearStart,
      taxJurisdictions: DEFAULT_FINANCE_CONFIG.taxJurisdictions,
      forecastHorizon: `${DEFAULT_FINANCE_CONFIG.forecastHorizonMonths} months`,
      reconciliation: DEFAULT_FINANCE_CONFIG.reconciliationFrequency,
    },
    chartOfAccounts: Object.keys(CHART_OF_ACCOUNTS).length,
    uptime: process.uptime(),
  });
}
