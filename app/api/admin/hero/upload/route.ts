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

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Enforce 200 KB file size limit for HD Hero Section
    if (file.size > MAX_HERO_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size (${(file.size / 1024).toFixed(1)} KB) exceeds the maximum limit of 200 KB for Hero Section.` },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let publicUrl = '';
    let uploadedToSupabase = false;
    const adminSupabase = createAdminSupabaseClient();

    if (adminSupabase) {
      const possibleBuckets = ['hero-section', 'Hero Section', 'hero_section', 'hero-media'];
      
      for (const bucketName of possibleBuckets) {
        try {
          const { data, error } = await adminSupabase.storage
            .from(bucketName)
            .upload(fileName, buffer, {
              contentType: file.type,
              upsert: true,
            });

          if (!error && data) {
            const { data: urlData } = adminSupabase.storage.from(bucketName).getPublicUrl(fileName);
            publicUrl = urlData.publicUrl;
            uploadedToSupabase = true;
            break;
          }
        } catch (err) {
          // try next bucket candidate
        }
      }
    }

    // Local disk fallback if Supabase storage upload didn't execute
    if (!uploadedToSupabase) {
      const localPath = saveHeroFileLocally(buffer, fileName);
      if (localPath) {
        publicUrl = localPath;
      } else {
        return NextResponse.json({ error: 'Failed to store file' }, { status: 500 });
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
    return NextResponse.json({ error: err.message || 'Failed to upload hero media' }, { status: 500 });
  }
}
