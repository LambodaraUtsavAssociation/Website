import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { getStoredHeroMetadata, saveStoredHeroMetadata, HeroMetadataItem } from '@/lib/data/heroMetadata';

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
    revalidatePath('/', 'layout');
    revalidatePath('/admin/hero', 'page');

    return NextResponse.json({ success: true, count: slides.length });
  } catch (err: any) {
    console.error('Failed to update hero metadata:', err);
    return NextResponse.json({ error: err.message || 'Failed to save hero updates' }, { status: 500 });
  }
}
