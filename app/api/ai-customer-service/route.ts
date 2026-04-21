import { NextRequest, NextResponse } from 'next/server';

const AI_AGENT_URL = process.env.AI_AGENT_URL || 'http://localhost:8000';
const MAX_AGENT_RETRIES = 1;
const AGENT_TIMEOUT_MS = 12000;

const timeoutFetch = async (url: string, options: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const forwardToAgent = async (body: any, attempt = 0): Promise<any> => {
  try {
    const response = await timeoutFetch(`${AI_AGENT_URL}/api/customer-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, AGENT_TIMEOUT_MS);

    if (!response.ok) {
      throw new Error(`AI Agent responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (attempt < MAX_AGENT_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return forwardToAgent(body, attempt + 1);
    }
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to the AI agent with one retry on transient failures.
    const result = await forwardToAgent(body);
    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Customer Service API Error:', error);
    return NextResponse.json(
      {
        response: 'Our AI assistant is temporarily unavailable. Please contact support by email at support@silverconnect.com or call our support line. For emergencies, use the local emergency number for your region.',
        error: error instanceof Error ? error.message : 'Unknown error',
        support_contact: {
          email: 'support@silverconnect.com',
          phone: '+61452409228'
        },
        emergency_numbers: {
          AU: '000',
          CN: '110 / 120 / 119',
          CA: '911'
        },
        emergency_contacts: {
          whatsapp: '+61452409228',
          wechat: '+61452409228',
          china_work: '+8618271390346',
          australia_work: '+61452409228',
          canada_work: '+16042486604'
        }
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  try {
    // Health check
    const response = await fetch(`${AI_AGENT_URL}/api/health`);
    const health = await response.json();

    return NextResponse.json({
      status: 'ok',
      ai_agent: health,
      contacts: {
        whatsapp: '+61452409228',
        wechat: '+61452409228',
        china_work: '+8618271390346',
        australia_work: '+61452409228',
        canada_work: '+16042486604'
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'AI service unavailable',
        fallback_contacts: {
          whatsapp: '+61452409228',
          wechat: '+61452409228',
          china_work: '+8618271390346',
          australia_work: '+61452409228',
          canada_work: '+16042486604'
        }
      },
      { status: 503 }
    );
  }
}
