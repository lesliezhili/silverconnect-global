import { NextResponse } from "next/server";
import { AGENT_REGISTRY, resolveAgent } from "@/lib/agents";

export const dynamic = "force-dynamic";

/** GET /api/agents/registry — list all agents and their capabilities */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const capability = searchParams.get("capability");

  if (capability) {
    const agent = resolveAgent(capability);
    if (!agent) return NextResponse.json({ error: `No agent handles: ${capability}` }, { status: 404 });
    return NextResponse.json({ agent });
  }

  return NextResponse.json({
    agents: AGENT_REGISTRY,
    totalCapabilities: AGENT_REGISTRY.reduce((s, a) => s + a.capabilities.length, 0),
  });
}
