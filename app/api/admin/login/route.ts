import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/schemas';
import { validateSupabaseAuth, setAdminSession } from '@/lib/auth';

// Basic rate limiting helper (in-memory)
const attemptsMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const attempt = attemptsMap.get(ip);

    if (attempt && attempt.resetAt > now) {
      if (attempt.count >= 5) {
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
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid login details' },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const authResult = await validateSupabaseAuth(email, password);

    if (!authResult.success) {
      const current = attemptsMap.get(ip);
      if (current) current.count += 1;
      return NextResponse.json(
        { error: authResult.error || 'Invalid administrator email or password.' },
        { status: 401 }
      );
    }

    // Success: clear rate limit and set HTTP-only session cookie
    attemptsMap.delete(ip);
    await setAdminSession(email);

    return NextResponse.json({ success: true, message: 'Authenticated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server authentication error' }, { status: 500 });
  }
}
