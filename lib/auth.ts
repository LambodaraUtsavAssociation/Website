import { cookies } from 'next/headers';

const ADMIN_SESSION_COOKIE = 'Vinayaka_admin_session';
const DEFAULT_ADMIN_EMAIL = 'admin@VinayakaChavithi.village';
const DEFAULT_ADMIN_PASS = 'VillageVinayaka2026!';

export interface AdminUser {
  email: string;
  role: 'admin';
}

export async function verifyAdminSession(): Promise<AdminUser | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken) return null;

  try {
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'));
    if (sessionData && sessionData.email && sessionData.exp > Date.now()) {
      return { email: sessionData.email, role: 'admin' };
    }
  } catch {
    return null;
  }

  return null;
}

export async function setAdminSession(email: string): Promise<string> {
  const cookieStore = cookies();
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const tokenPayload = JSON.stringify({ email, role: 'admin', exp });
  const token = Buffer.from(tokenPayload).toString('base64');

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return token;
}

export async function clearAdminSession() {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function validateAdminCredentials(email: string, pass: string): boolean {
  return email.trim().toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() && pass === DEFAULT_ADMIN_PASS;
}
