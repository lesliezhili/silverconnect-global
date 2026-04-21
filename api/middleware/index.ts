import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP
 */

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};
const RATE_LIMIT = 100; // requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute

export function rateLimit(
  maxRequests: number = RATE_LIMIT,
  windowMs: number = WINDOW_MS
) {
  return function middleware(request: NextRequest) {
    const ip = getClientIp(request);
    const now = Date.now();

    // Initialize or reset if window has passed
    if (!rateLimitStore[ip] || rateLimitStore[ip].resetTime < now) {
      rateLimitStore[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return null; // Allow
    }

    // Increment counter
    rateLimitStore[ip].count++;

    // Check if limit exceeded
    if (rateLimitStore[ip].count > maxRequests) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rateLimitStore[ip].resetTime - now) / 1000)
            ),
          },
        }
      );
    }

    return null; // Allow
  };
}

/**
 * Get client IP address
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    (request as any).ip ||
    'unknown'
  );
}

/**
 * CORS Middleware
 */
export function withCors(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: response.headers });
  }

  return response;
}

/**
 * Authentication Middleware
 */
export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing authorization token' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  // Verify token (implementation depends on your auth provider)
  // For now, just check if token exists
  if (!token) {
    return NextResponse.json(
      { error: 'Invalid authorization token' },
      { status: 401 }
    );
  }

  return null; // Allow
}
