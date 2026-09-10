import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { verifyAdminSession } from '@/lib/auth';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/telemetry';

const MAX_HERO_SIZE_BYTES = 200 * 1024; // 200 KB limit for HD clarity

function saveHeroFileLocally(buffer: Buffer, filename: string): string {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hero-section');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/hero-section/${filename}`;
  } catch (err) {
    console.error('Failed local hero file save:', err);
    return '';
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const directUrl = (formData.get('url') as string) || '';
    const caption = (formData.get('caption') as string) || '';

    if (directUrl) {
      const adminSupabase = createAdminSupabaseClient();
      if (adminSupabase) {
        try {
          await adminSupabase.from('hero_media').insert([
            {
              url: directUrl,
              caption: caption || 'Hero Visual Slide',
              alt: caption || 'Hero Visual Slide',
              is_active: true,
              display_order: 1,
            },
          ]);
        } catch (dbErr) {
          console.warn('Hero media insert warning:', dbErr);
        }
      }

      logAuditEvent({
        action: 'UPLOAD_HERO_MEDIA',
        targetEntity: 'HeroMedia',
        entityId: caption || 'HeroMedia',
        request,
        details: { publicUrl: directUrl },
      });

      revalidatePath('/', 'layout');

      return NextResponse.json({
        success: true,
        url: directUrl,
        fileName: caption || 'hero_media',
      });
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let publicUrl = '';
    const { isR2Configured, uploadBufferToR2, buildR2Key } = await import('@/lib/r2');

    // 1. Upload to Cloudflare R2
    if (isR2Configured()) {
      try {
        const key = buildR2Key('hero', sanitizedName);
        publicUrl = await uploadBufferToR2(buffer, key, file.type || 'image/jpeg');
      } catch (r2Err: any) {
        console.warn('R2 hero upload fallback to local disk:', r2Err.message);
      }
    }

    // 2. Local disk fallback
    if (!publicUrl) {
      const localPath = saveHeroFileLocally(buffer, fileName);
      if (localPath) {
        publicUrl = localPath;
      } else {
        return NextResponse.json({ error: 'Failed to store file' }, { status: 500 });
      }
    }

    // 3. Save to Supabase hero_media table
    const adminSupabase = createAdminSupabaseClient();
    if (adminSupabase) {
      try {
        await adminSupabase.from('hero_media').insert([
          {
            url: publicUrl,
            caption: caption || sanitizedName,
            alt: caption || sanitizedName,
            is_active: true,
            display_order: 1,
          },
        ]);
      } catch (dbErr) {
        console.warn('Hero media DB insert warning:', dbErr);
      }
    }

    logAuditEvent({
      action: 'UPLOAD_HERO_MEDIA',
      targetEntity: 'HeroMedia',
      entityId: fileName,
      request,
      details: { sizeKB: (file.size / 1024).toFixed(1), publicUrl },
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      sizeBytes: file.size,
      sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
    });
  } catch (err: any) {
    console.error('Hero upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload hero media' },
      { status: 500 }
    );
  }
}
