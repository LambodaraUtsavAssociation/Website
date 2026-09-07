import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = 'skipped';
  let storageStatus = 'skipped';

  try {
    const supabase = createAdminSupabaseClient() || createClient();

    // 1. Keep Database Awake: Ping festival_years table
    const { data: dbData, error: dbErr } = await supabase.from('festival_years').select('id').limit(1);
    if (!dbErr) {
      dbStatus = 'active (query ok)';
    } else {
      dbStatus = `warning (${dbErr.message})`;
    }

    // 2. Keep Storage Awake: Ping festival-media bucket
    const { data: storageData, error: storageErr } = await supabase.storage.from('festival-media').list('', { limit: 1 });
    if (!storageErr) {
      storageStatus = 'active (storage ok)';
    } else {
      storageStatus = `warning (${storageErr?.message || 'list error'})`;
    }
  } catch (err: any) {
    console.error('Keep-alive ping exception:', err);
  }

  return NextResponse.json({
    success: true,
    timestamp,
    service: 'Supabase Keep-Alive Heartbeat',
    database: dbStatus,
    storage: storageStatus,
    message: 'Supabase database and storage services successfully pinged and kept active.',
  });
}
