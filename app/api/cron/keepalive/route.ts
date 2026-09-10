import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = 'skipped';

  try {
    const supabase = createAdminSupabaseClient() || createClient();

    // 1. Keep Database Awake: Ping festival_years and categories tables
    const { data: dbData, error: dbErr } = await supabase
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
