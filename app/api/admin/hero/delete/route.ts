import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { verifyAdminSession } from '@/lib/auth';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, fileName } = body;

    if (!url && !fileName) {
      return NextResponse.json({ error: 'Missing target file name or URL' }, { status: 400 });
    }

    // Extract raw filename from URL if full URL was provided
    let targetFileName = fileName;
    if (!targetFileName && url) {
      const cleanUrl = url.split('?')[0];
      if (cleanUrl.includes('/hero-section/')) {
        targetFileName = decodeURIComponent(cleanUrl.split('/hero-section/')[1]);
      } else if (cleanUrl.includes('/images/hero/')) {
        targetFileName = decodeURIComponent(cleanUrl.split('/images/hero/')[1]);
      } else {
        const parts = cleanUrl.split('/');
        targetFileName = decodeURIComponent(parts[parts.length - 1]);
      }
    }

    if (!targetFileName) {
      return NextResponse.json({ error: 'Invalid file reference' }, { status: 400 });
    }

    const adminSupabase = createAdminSupabaseClient();

    // 1. Delete from Cloudflare R2 if URL is R2
    try {
      const { deleteR2Object } = await import('@/lib/r2');
      if (url) {
        await deleteR2Object(url);
      }
    } catch (r2Err) {
      console.warn('R2 delete warning:', r2Err);
    }

    // 2. Delete from Supabase hero_media table
    if (adminSupabase && url) {
      try {
        await adminSupabase.from('hero_media').delete().eq('url', url);
      } catch (dbErr) {
        console.warn('Supabase hero_media delete warning:', dbErr);
      }
    }

    // Check direct relative local path if URL starts with '/'
    if (url && url.startsWith('/')) {
      const directPath = path.join(process.cwd(), 'public', url.split('?')[0]);
      if (fs.existsSync(directPath)) {
        try {
          fs.unlinkSync(directPath);
        } catch (err) {
          console.warn('Failed unlinking direct path:', directPath, err);
        }
      }
    }

    // Also check standard local disk storage directories
    const possibleLocalDirs = [
      path.join(process.cwd(), 'public', 'uploads', 'hero-section'),
      path.join(process.cwd(), 'public', 'images', 'hero'),
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'public', 'images'),
    ];

    for (const dir of possibleLocalDirs) {
      if (targetFileName) {
        const filePath = path.join(dir, targetFileName);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.warn('Failed local hero file deletion:', filePath, err);
          }
        }
      }
    }

    logAuditEvent({
      action: 'DELETE_HERO_MEDIA',
      targetEntity: 'HeroMedia',
      entityId: targetFileName,
      request,
      details: { targetFileName, url },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/hero', 'page');

    return NextResponse.json({ success: true, fileName: targetFileName });
  } catch (err: any) {
    console.error('Hero delete error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete hero media' },
      { status: 500 }
    );
  }
}
