import { NextResponse } from "next/server";
import { DEFAULT_SERVICE_CONFIG, SERVICE_AGENT_CAPABILITIES } from "@/lib/agents/service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    agent: "service-agent",
    status: "active",
    version: "1.0.0",
    capabilities: SERVICE_AGENT_CAPABILITIES,
    config: {
      rankingWeights: DEFAULT_SERVICE_CONFIG.rankingWeights,
      maxSearchRadius: DEFAULT_SERVICE_CONFIG.maxSearchRadius,
      matchingAlgorithm: DEFAULT_SERVICE_CONFIG.matchingAlgorithm,
    },
    uptime: process.uptime(),
  });
}
