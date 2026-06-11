/**
 * SilverConnect Global — Agent Registry
 * 
 * Central orchestration layer for all platform agents.
 * Each agent is independently deployable as a microservice.
 * 
 * Architecture:
 * ┌────────────────────────────────────────────────────┐
 * │              Agent Orchestrator                      │
 * │  (Routes requests to appropriate agent)             │
 * └────────┬──────────────┬──────────────┬─────────────┘
 *          │              │              │
 *  ┌───────▼───────┐ ┌───▼────────┐ ┌──▼──────────┐
 *  │  Service      │ │  Sales &   │ │  Finance    │
 *  │  Agent        │ │  Marketing │ │  Agent      │
 *  │               │ │  Agent     │ │             │
 *  │ • Matching    │ │ • Promos   │ │ • Ledger    │
 *  │ • Booking     │ │ • Referral │ │ • P&L       │
 *  │ • Scheduling  │ │ • Growth   │ │ • Forecast  │
 *  │ • Quality     │ │ • Campaigns│ │ • Budget    │
 *  │ • Reviews     │ │ • Segment  │ │ • Tax       │
 *  └───────────────┘ └────────────┘ └─────────────┘
 * 
 * Deployment Options:
 * 1. Monolith: All agents in one Next.js app (current)
 * 2. Modular: Each agent as a separate Vercel project
 * 3. Serverless: Each capability as an individual function
 * 4. Container: Each agent as a Docker service (K8s)
 */

import { DEFAULT_SERVICE_CONFIG, SERVICE_AGENT_CAPABILITIES } from "./service";
import { DEFAULT_SALES_CONFIG, SALES_AGENT_CAPABILITIES } from "./sales";
import { DEFAULT_FINANCE_CONFIG, FINANCE_AGENT_CAPABILITIES } from "./finance";

export interface AgentManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: readonly string[];
  healthEndpoint: string;
  configEndpoint: string;
  status: "active" | "degraded" | "offline";
}

export const AGENT_REGISTRY: AgentManifest[] = [
  {
    id: "service-agent",
    name: "Service Agent",
    version: "1.0.0",
    description: "Provider matching, booking lifecycle, quality scoring, smart ranking",
    capabilities: SERVICE_AGENT_CAPABILITIES,
    healthEndpoint: "/api/agents/service/health",
    configEndpoint: "/api/agents/service/config",
    status: "active",
  },
  {
    id: "sales-agent",
    name: "Sales & Marketing Agent",
    version: "1.0.0",
    description: "Customer acquisition, referrals, campaigns, growth analytics",
    capabilities: SALES_AGENT_CAPABILITIES,
    healthEndpoint: "/api/agents/sales/health",
    configEndpoint: "/api/agents/sales/config",
    status: "active",
  },
  {
    id: "finance-agent",
    name: "Finance Agent",
    version: "1.0.0",
    description: "Bookkeeping, accounting, forecasting, budgeting, tax compliance",
    capabilities: FINANCE_AGENT_CAPABILITIES,
    healthEndpoint: "/api/agents/finance/health",
    configEndpoint: "/api/agents/finance/config",
    status: "active",
  },
];

/** Route a capability request to the correct agent */
export function resolveAgent(capability: string): AgentManifest | null {
  return AGENT_REGISTRY.find((a) => (a.capabilities as readonly string[]).includes(capability)) ?? null;
}

export { DEFAULT_SERVICE_CONFIG, DEFAULT_SALES_CONFIG, DEFAULT_FINANCE_CONFIG };
export { SERVICE_AGENT_CAPABILITIES, SALES_AGENT_CAPABILITIES, FINANCE_AGENT_CAPABILITIES };
