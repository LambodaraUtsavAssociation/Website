import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) {
    return NextResponse.json({ error: 'No admin client' });
  }

  // Try updating or checking if blessing_count column exists
  const { data, error } = await adminSupabase
    .from('memories')
    .select('id, title, blessing_count, display_order')
    .limit(1);

  return NextResponse.json({ data, error });
}
