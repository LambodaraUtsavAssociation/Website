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

const TARGET_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  'vinayakachavithiprp@gmail.com'
)
  .trim()
  .toLowerCase();

export async function validateSupabaseAuth(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // Enforce authorized administrator email
  if (cleanEmail !== TARGET_ADMIN_EMAIL) {
    return {
      success: false,
      error: `Access Denied: Only authorized administrator (${TARGET_ADMIN_EMAIL}) is permitted.`,
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('demo-Vinayaka-Chavithi')) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (!error && data?.user) {
        if (data.user.email?.toLowerCase() === TARGET_ADMIN_EMAIL) {
          return { success: true };
        } else {
          return { success: false, error: 'Unauthorized user email.' };
        }
      }

      // Check configured admin password fallback
      const envAdminPass = process.env.ADMIN_PASSWORD || 'Luaprp@2026';
      if (pass === envAdminPass) {
        return { success: true };
      }

      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      console.error('Supabase Auth verification error:', err);
    }
  }

  // Fallback check
  const envAdminPass = process.env.ADMIN_PASSWORD || 'Luaprp@2026';
  if (pass === envAdminPass) {
    return { success: true };
  }

  return { success: false, error: 'Invalid administrator password.' };
}
