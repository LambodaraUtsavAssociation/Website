import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';
import { checkRateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function GET(request: NextRequest) {
  // 1. Rate limiting (max 120 req / minute per IP)
  const rlResult = checkRateLimit(request, RATE_LIMITS.PUBLIC_READ, 'cron-keepalive');
  if (!rlResult.success) {
    return rateLimitExceededResponse(rlResult);
  }

  // 2. Strict CRON_SECRET Enforcement (Fail-closed)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'Server misconfiguration: CRON_SECRET is not set in environment.' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization') || '';
  const querySecret = request.nextUrl.searchParams.get('secret') || '';
  const expectedBearer = `Bearer ${cronSecret}`;

  const isBearerValid = authHeader.startsWith('Bearer ') && timingSafeEqual(authHeader, expectedBearer);
  const isQueryValid = querySecret.length > 0 && timingSafeEqual(querySecret, cronSecret);

  if (!isBearerValid && !isQueryValid) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing cron authentication token.' },
      { status: 401 }
    );
  }

  const timestamp = new Date().toISOString();
  let dbStatus = 'skipped';

  try {
    const supabase = createAdminSupabaseClient() || createClient();

    // Keep Database Awake: Ping festival_years and categories tables
    const { error: dbErr } = await supabase
      .from('festival_years')
      .select('id')
      .limit(1);

    if (!dbErr) {
      dbStatus = 'active (query ok)';
    } else {
      dbStatus = `warning (${dbErr.message})`;
    }
  } catch (err: any) {
    console.error('Keep-alive ping exception:', err);
  }

  return NextResponse.json({
    success: true,
    timestamp,
    service: 'Supabase Keep-Alive Heartbeat',
    database: dbStatus,
    message: 'Supabase PostgreSQL database successfully pinged and kept active.',
  });
}
