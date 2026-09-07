import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { getStoredHeroMetadata, formatHeroCaption } from '@/lib/data/heroMetadata';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_HERO_FILE_SIZE_BYTES = 200 * 1024; // 200 KB limit for HD clarity

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
  const storedMetadata = getStoredHeroMetadata();

  // 1. Check Supabase Storage using admin client (bypasses client-side RLS list restrictions)
  try {
    const adminSupabase = createAdminSupabaseClient();
    if (adminSupabase) {
      const possibleBuckets = ['hero-section', 'Hero Section', 'hero_section', 'hero-media'];

      for (const bucketName of possibleBuckets) {
        const { data: files, error } = await adminSupabase.storage.from(bucketName).list('', {
          limit: 50,
          sortBy: { column: 'created_at', order: 'desc' },
        });

        if (!error && files && files.length > 0) {
          const validFiles = files.filter((f: any) => {
            if (!f.name || f.name.startsWith('.')) return false;
            const size = f.metadata?.size ?? f.metadata?.contentLength ?? 0;
            if (size > 0 && size > MAX_HERO_FILE_SIZE_BYTES) {
              return false;
            }
            return true;
          });

          if (validFiles.length > 0) {
            validFiles.forEach((f: any) => {
              const { data } = adminSupabase.storage.from(bucketName).getPublicUrl(f.name);
              const publicUrl = data.publicUrl;
              const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(f.name);
              
              const meta = storedMetadata[publicUrl] || storedMetadata[f.name] || {};
              const caption = meta.caption || formatHeroCaption(f.name);
              const alt = meta.alt || caption;
              const isPublished = meta.isPublished !== false;
              const order = meta.order ?? 999;

              rawItems.push({
                url: publicUrl,
                caption,
                alt,
                isVideo,
                isPublished,
                order,
              });
            });
            break; // Stop after first bucket with valid items
          }
        }
      }
    }
  } catch (err) {
    console.warn('Supabase hero storage fetch warning:', err);
  }

  // 2. Check local disk storage fallback (/public/uploads/hero-section)
  try {
    const localDir = path.join(process.cwd(), 'public', 'uploads', 'hero-section');
    if (fs.existsSync(localDir)) {
      const localFiles = fs.readdirSync(localDir);
      localFiles.forEach((filename) => {
        if (!filename.startsWith('.')) {
          const filePath = path.join(localDir, filename);
          const stat = fs.statSync(filePath);
          if (stat.isFile() && stat.size <= MAX_HERO_FILE_SIZE_BYTES) {
            const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(filename);
            const localUrl = `/uploads/hero-section/${filename}`;
            
            // Avoid duplicate entries if already found in Supabase
            if (!rawItems.some((item) => item.url.includes(filename))) {
              const meta = storedMetadata[localUrl] || storedMetadata[filename] || {};
              const caption = meta.caption || formatHeroCaption(filename);
              const alt = meta.alt || caption;
              const isPublished = meta.isPublished !== false;
              const order = meta.order ?? 999;

              rawItems.push({
                url: localUrl,
                caption,
                alt,
                isVideo,
                isPublished,
                order,
              });
            }
          }
        }
      });
    }
  } catch (err) {
    console.warn('Local hero storage fetch warning:', err);
  }

  // Sort by saved order first, then maintain array position
  rawItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  // Filter out unpublished items unless requested by admin (all=true)
  const finalItems = includeAll ? rawItems : rawItems.filter((item) => item.isPublished !== false);

  return NextResponse.json({ success: true, items: finalItems });
}
