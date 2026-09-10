import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import {
  getStoredHeroMetadata,
  saveStoredHeroMetadata,
  HeroMetadataItem,
} from '@/lib/data/heroMetadata';

export async function POST(request: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slides } = body as { slides: HeroMetadataItem[] };

    if (!Array.isArray(slides)) {
      return NextResponse.json({ error: 'Invalid slides payload' }, { status: 400 });
    }

    const currentMetadata = getStoredHeroMetadata();

    slides.forEach((item, index) => {
      if (item.url) {
        currentMetadata[item.url] = {
          url: item.url,
          caption: item.caption || 'Hero Visual Slide',
          alt: item.alt || item.caption || 'Hero Visual Slide',
          isPublished: item.isPublished !== false,
          order: index + 1,
        };
      }
    });

    saveStoredHeroMetadata(currentMetadata);

    // Sync to Supabase hero_media table
    try {
      const { createAdminSupabaseClient } = await import('@/lib/supabase/server');
      const adminSupabase = createAdminSupabaseClient();
      if (adminSupabase) {
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          if (slide.url) {
            await adminSupabase
              .from('hero_media')
              .update({
                caption: slide.caption || 'Hero Slide',
                alt: slide.alt || slide.caption || 'Hero Slide',
                is_active: slide.isPublished !== false,
                display_order: i + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('url', slide.url);
          }
        }
      }
    } catch (dbErr) {
      console.warn('Supabase hero_media update sync warning:', dbErr);
    }

    revalidatePath('/', 'layout');
    revalidatePath('/admin/hero', 'page');

    return NextResponse.json({ success: true, count: slides.length });
  } catch (err: any) {
    console.error('Failed to update hero metadata:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to save hero updates' },
      { status: 500 }
    );
  }
}
