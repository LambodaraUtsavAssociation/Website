import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/schemas';
import { validateSupabaseAuth, setAdminSession } from '@/lib/auth';
import { logAdminAuthAttempt } from '@/lib/authLogger';

// Basic rate limiting helper (in-memory)
const attemptsMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const now = Date.now();

  try {
    const attempt = attemptsMap.get(ip);

    if (attempt && attempt.resetAt > now) {
      if (attempt.count >= 5) {
        await logAdminAuthAttempt({
          email: 'unknown',
          ip_address: ip,
          user_agent: userAgent,
          status: 'failed',
          failure_reason: 'Rate limit exceeded (Too many failed attempts)',
        });

        return NextResponse.json(
          { error: 'Too many failed login attempts. Please wait 5 minutes before trying again.' },
          { status: 429 }
        );
      }
    } else {
      attemptsMap.set(ip, { count: 0, resetAt: now + 5 * 60 * 1000 });
    }

    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.errors[0]?.message || 'Invalid login details';
      await logAdminAuthAttempt({
        email: body?.email || 'invalid',
        ip_address: ip,
        user_agent: userAgent,
        status: 'failed',
        failure_reason: errorMsg,
      });

      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { email, password } = result.data;
    const authResult = await validateSupabaseAuth(email, password);

    if (!authResult.success) {
      const current = attemptsMap.get(ip);
      if (current) current.count += 1;

      const reason = authResult.error || 'Invalid administrator email or password.';
      await logAdminAuthAttempt({
        email,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failed',
        failure_reason: reason,
      });

      return NextResponse.json({ error: reason }, { status: 401 });
    }

    // Success: record audit log, clear rate limit, and set HTTP-only session cookie
    attemptsMap.delete(ip);
    await logAdminAuthAttempt({
      email,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      failure_reason: null,
    });

    await setAdminSession(email);

    return NextResponse.json({ success: true, message: 'Authenticated successfully' });
  } catch (err: any) {
    await logAdminAuthAttempt({
      email: 'unknown',
      ip_address: ip,
      user_agent: userAgent,
      status: 'failed',
      failure_reason: err?.message || 'Server authentication error',
    });

    return NextResponse.json({ error: 'Server authentication error' }, { status: 500 });
  }
}
