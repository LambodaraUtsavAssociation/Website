import { NextRequest, NextResponse } from 'next/server';
import { getBlessingCounts, toggleBlessing } from '@/lib/data/blessingsStore';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';
import { checkRateLimit, rateLimitExceededResponse, RATE_LIMITS, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const admin = createAdminSupabaseClient();
  return admin || createClient();
}

export async function GET(request: NextRequest) {
  // Rate limit GET requests (max 120 req / minute per IP)
  const rlResult = checkRateLimit(request, RATE_LIMITS.PUBLIC_READ, 'blessings-get');
  if (!rlResult.success) {
    return rateLimitExceededResponse(rlResult);
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('memories')
      .select('id, blessing_count, is_blessed');

    if (!error && data && data.length > 0) {
      const blessingsMap: Record<string, number> = {};
      const isBlessedMap: Record<string, boolean> = {};
      data.forEach((item: any) => {
        blessingsMap[item.id] = item.blessing_count || 0;
        isBlessedMap[item.id] = !!item.is_blessed;
      });
      const response = NextResponse.json({ success: true, blessings: blessingsMap, isBlessed: isBlessedMap });
      response.headers.set('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60');
      return response;
    }
  } catch (err) {
    console.warn('GET /api/memories/bless Supabase fallback:', err);
  }

  const counts = getBlessingCounts();
  return NextResponse.json({ success: true, blessings: counts, isBlessed: {} });
}

export async function POST(request: NextRequest) {
  // Rate limit POST actions (max 45 blessings per minute per IP)
  const rlResult = checkRateLimit(request, RATE_LIMITS.BLESSINGS_POST, 'blessings-post');
  if (!rlResult.success) {
    return rateLimitExceededResponse(rlResult);
  }

  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const { memoryId, action } = body as { memoryId: string; action: 'bless' | 'unbless' };

    if (!memoryId) {
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 });
    }

    const isBless = action !== 'unbless';
    let newCount = toggleBlessing(memoryId, isBless ? 'bless' : 'unbless');

    // Sync with Supabase Database via Atomic Postgres RPC (Race-condition free)
    try {
      const supabase = getSupabaseClient();
      const rpcFunction = isBless ? 'increment_blessing' : 'decrement_blessing';
      const { data: rpcCount, error: rpcError } = await supabase.rpc(rpcFunction, {
        mem_id: memoryId,
      });

      if (!rpcError && typeof rpcCount === 'number') {
        newCount = rpcCount;
      } else {
        // Graceful fallback to select + update
        const { data: existing } = await supabase
          .from('memories')
          .select('id, blessing_count, is_blessed')
          .eq('id', memoryId)
          .single();

        if (existing) {
          const currentCount = existing.blessing_count || 0;
          newCount = isBless ? currentCount + 1 : Math.max(0, currentCount - 1);

          await supabase
            .from('memories')
            .update({
              blessing_count: newCount,
              is_blessed: isBless,
              updated_at: new Date().toISOString(),
            })
            .eq('id', memoryId);
        }
      }

      // Log blessing audit row
      await supabase.from('blessings').insert([
        {
          memory_id: memoryId,
          action: isBless ? 'bless' : 'unbless',
          user_ip: clientIp,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (dbErr) {
      console.warn('Supabase blessing DB sync warning:', dbErr);
    }

    const response = NextResponse.json({
      success: true,
      memoryId,
      count: newCount,
      is_blessed: isBless,
    });
    response.headers.set('X-RateLimit-Limit', rlResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rlResult.remaining.toString());
    return response;
  } catch (err: any) {
    console.error('Failed to toggle blessing:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update blessing' },
      { status: 500 }
    );
  }
}
