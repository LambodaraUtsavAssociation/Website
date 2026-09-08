import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HeroItemWithMeta {
  url: string;
  caption: string;
  alt: string;
  isVideo?: boolean;
  isPublished?: boolean;
  order?: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get('all') === 'true' || searchParams.get('onlyPublished') === 'false';
  
  const rawItems: HeroItemWithMeta[] = [];

  // 1. Query Supabase Database for featured Cloudflare R2 photo memories and hero_media
  try {
    const adminSupabase = createAdminSupabaseClient();
    if (adminSupabase) {
      // A. Query featured photo memories from memories table
      let memQuery = adminSupabase
        .from('memories')
        .select('*')
        .eq('is_featured', true)
        .eq('media_type', 'image')
        .order('display_order', { ascending: true });

      if (!includeAll) {
        memQuery = memQuery.eq('is_published', true);
      }

      const { data: memItems, error: memErr } = await memQuery;
      if (!memErr && memItems && memItems.length > 0) {
        memItems.forEach((m: any) => {
          const imgUrl = m.full_path || m.storage_path;
          if (imgUrl) {
            rawItems.push({
              url: imgUrl,
              caption: m.title || 'Sri Vinayaka Chavithi Celebration',
              alt: m.telugu_title || m.title || 'Papi Reddy Palli Mandap',
              isVideo: false,
              isPublished: m.is_published !== false,
              order: m.display_order ?? 1,
            });
          }
        });
      }

      // B. Query hero_media table
      let query = adminSupabase.from('hero_media').select('*').order('display_order', { ascending: true });
      if (!includeAll) {
        query = query.eq('is_active', true);
      }
      const { data: dbItems, error: dbErr } = await query;
      if (!dbErr && dbItems && dbItems.length > 0) {
        dbItems.forEach((item: any) => {
          if (item.url && !rawItems.some((r) => r.url === item.url)) {
            rawItems.push({
              url: item.url,
              caption: item.caption || 'Hero Slide',
              alt: item.alt || item.caption || 'Hero Slide',
              isVideo: !!item.is_video,
              isPublished: item.is_active !== false,
              order: item.display_order ?? 999,
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('Hero media database query warning:', err);
  }

  // Sort by saved order first, then maintain array position
  rawItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  // Filter out unpublished items unless requested by admin (all=true)
  const finalItems = includeAll ? rawItems : rawItems.filter((item) => item.isPublished !== false);

  return NextResponse.json({ success: true, items: finalItems });
}
