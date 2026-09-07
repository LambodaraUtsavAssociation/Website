import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { verifyAdminSession } from '@/lib/auth';
import { createMemory, getFestivalYears } from '@/lib/data/repository';
import { logAuditEvent } from '@/lib/telemetry';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

function saveFileLocally(buffer: Buffer, folderName: string, filename: string): string {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folderName);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${folderName}/${filename}`;
  } catch (err) {
    console.error('Failed local file save:', err);
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
    const thumbnailFile = formData.get('thumbnail') as File | null;

    const title = (formData.get('title') as string) || 'Untitled Memory';
    const description = (formData.get('description') as string) || '';
    
    // Ensure valid festival year ID
    const years = await getFestivalYears();
    const defaultYearId = years[0]?.id || 'f2026000-0000-0000-0000-000000002026';
    let festivalYearId = (formData.get('festival_year_id') as string) || defaultYearId;
    if (!festivalYearId || festivalYearId === 'undefined') {
      festivalYearId = defaultYearId;
    }

    const categoryId = (formData.get('category_id') as string) || '';
    const captureDate = (formData.get('capture_date') as string) || new Date().toISOString().split('T')[0];
    const mediaType = (formData.get('media_type') as 'image' | 'video') || 'image';
    const isFeatured = formData.get('is_featured') === 'true';
    const isPublished = formData.get('is_published') !== 'false';

    let storagePath = '';
    let thumbnailPath = '';

    if (file && file.size > 0) {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${mediaType}s/${timestamp}_${sanitizedName}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let uploadedSuccessfully = false;
      const adminSupabase = createAdminSupabaseClient();

      if (adminSupabase) {
        try {
          const { data: uploadData, error: uploadErr } = await adminSupabase.storage
            .from('festival-media')
            .upload(filePath, buffer, {
              contentType: file.type,
              upsert: true,
            });

          if (!uploadErr && uploadData) {
            const { data: publicUrlData } = adminSupabase.storage
              .from('festival-media')
              .getPublicUrl(filePath);
            storagePath = publicUrlData.publicUrl;
            thumbnailPath = storagePath;
            uploadedSuccessfully = true;

            if (thumbnailFile && thumbnailFile.size > 0) {
              const thumbPath = `thumbnails/${timestamp}_thumb.webp`;
              const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
              const { data: thumbUploadData } = await adminSupabase.storage
                .from('festival-media')
                .upload(thumbPath, thumbBuffer, {
                  contentType: 'image/webp',
                  upsert: true,
                });

              if (thumbUploadData) {
                const { data: thumbPublicUrlData } = adminSupabase.storage
                  .from('festival-media')
                  .getPublicUrl(thumbPath);
                thumbnailPath = thumbPublicUrlData.publicUrl;
              }
            }
          } else if (uploadErr) {
            console.warn('Supabase storage upload error, using local fallback:', uploadErr.message);
          }
        } catch (err: any) {
          console.warn('Supabase storage exception, using local fallback:', err?.message || err);
        }
      }

      // Local disk storage fallback if Supabase storage was not used or failed
      if (!uploadedSuccessfully) {
        const localPath = saveFileLocally(buffer, `${mediaType}s`, `${timestamp}_${sanitizedName}`);
        if (localPath) {
          storagePath = localPath;
          thumbnailPath = localPath;
        }

        if (thumbnailFile && thumbnailFile.size > 0) {
          const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
          const localThumbPath = saveFileLocally(thumbBuffer, 'thumbnails', `${timestamp}_thumb.webp`);
          if (localThumbPath) {
            thumbnailPath = localThumbPath;
          }
        }
      }
    }

    const createdMemory = await createMemory({
      festival_year_id: festivalYearId,
      category_id: categoryId || undefined,
      media_type: mediaType,
      title,
      description,
      capture_date: captureDate,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      is_featured: isFeatured,
      is_published: isPublished,
    });

    if (!createdMemory) {
      return NextResponse.json({ error: 'Failed to create memory in database' }, { status: 500 });
    }

    // Enterprise Audit Telemetry & Cache Invalidation
    logAuditEvent({
      action: 'UPLOAD_MEMORY',
      targetEntity: 'Memory',
      entityId: createdMemory.id,
      request,
      details: { title, mediaType, festivalYearId, isPublished },
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, memory: createdMemory });
  } catch (err: any) {
    console.error('Upload endpoint error:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload memory' }, { status: 500 });
  }
}

