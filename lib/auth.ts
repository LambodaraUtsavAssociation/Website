import { cookies } from 'next/headers';
import { signSessionToken, verifySessionToken } from './sessionCrypto';

export const ADMIN_SESSION_COOKIE = 'Vinayaka_admin_session';

export interface AdminUser {
  email: string;
  role: 'admin';
}

export async function verifyAdminSession(): Promise<AdminUser | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken) return null;

  const session = await verifySessionToken(sessionToken);
  if (!session) return null;

  return { email: session.email, role: 'admin' };
}

export async function setAdminSession(email: string): Promise<string> {
  const cookieStore = cookies();
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const token = await signSessionToken({ email, role: 'admin', exp });

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

export async function validateSupabaseAuth(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const targetAdminEmail = (
    process.env.ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    ''
  )
    .trim()
    .toLowerCase();

  if (!targetAdminEmail) {
    return {
      success: false,
      error: 'Server configuration error: ADMIN_EMAIL is not configured.',
    };
  }

  // Enforce authorized administrator email
  if (cleanEmail !== targetAdminEmail) {
    return {
      success: false,
      error: 'Access Denied: Only authorized administrator is permitted.',
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
        if (data.user.email?.toLowerCase() === targetAdminEmail) {
          return { success: true };
        } else {
          return { success: false, error: 'Unauthorized user email.' };
        }
      }

      // Check configured admin password
      const envAdminPass = process.env.ADMIN_PASSWORD;
      if (envAdminPass && pass === envAdminPass) {
        return { success: true };
      }

      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      console.error('Supabase Auth verification error:', err);
    }
  }

  // Fallback check against configured environment variable
  const envAdminPass = process.env.ADMIN_PASSWORD;
  if (envAdminPass && pass === envAdminPass) {
    return { success: true };
  }

  return { success: false, error: 'Invalid administrator password.' };
}
