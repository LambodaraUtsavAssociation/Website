import { NextResponse } from 'next/server';

export interface RateLimitConfig {
  /** Maximum allowed requests within the time window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

// In-memory sliding window store
interface WindowEntry {
  count: number;
  resetAt: number;
}

const rateLimitStores = new Map<string, Map<string, WindowEntry>>();

// Periodic cleanup to avoid memory leaks
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [, store] of rateLimitStores.entries()) {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }
}

/**
 * Standard rate limit configurations for various API tiers
 */
export const RATE_LIMITS = {
  // Public read APIs (e.g. hero-media, blessings GET): 120 req / minute
  PUBLIC_READ: { limit: 120, windowMs: 60 * 1000 },
  // Devotional blessings mutation: 45 blessings / minute per IP
  BLESSINGS_POST: { limit: 45, windowMs: 60 * 1000 },
  // Admin login brute-force protection: 6 attempts per 5 minutes per IP
  ADMIN_LOGIN: { limit: 6, windowMs: 5 * 60 * 1000 },
  // Admin mutation & uploads: 60 actions / minute
  ADMIN_MUTATIONS: { limit: 60, windowMs: 60 * 1000 },
} as const;

/**
 * Extracts best client IP from incoming request headers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Evaluates rate limit for a client IP and namespace
 */
export function checkRateLimit(
  req: Request,
  config: RateLimitConfig = RATE_LIMITS.PUBLIC_READ,
  namespace = 'default'
): RateLimitResult {
  cleanupExpired();

  const ip = getClientIp(req);
  if (!rateLimitStores.has(namespace)) {
    rateLimitStores.set(namespace, new Map<string, WindowEntry>());
  }

  const store = rateLimitStores.get(namespace)!;
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(ip, { count: 1, resetAt });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: Math.ceil(resetAt / 1000),
    };
  }

  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: Math.ceil(entry.resetAt / 1000),
    };
  }

  entry.count += 1;
  return {
    success: true,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    reset: Math.ceil(entry.resetAt / 1000),
  };
}

/**
 * Generates an HTTP 429 Too Many Requests response with standard headers
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil(result.reset - Date.now() / 1000));

  return NextResponse.json(
    {
      error: 'Too many requests. Please wait a moment and try again.',
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfterSeconds.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.reset.toString(),
      },
    }
  );
}
