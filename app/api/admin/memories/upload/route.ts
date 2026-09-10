import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { verifyAdminSession } from '@/lib/auth';
import { createMemory, getFestivalYears } from '@/lib/data/repository';
import { logAuditEvent } from '@/lib/telemetry';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/youtube';
import { uploadBufferToR2, isR2Configured, buildR2Key } from '@/lib/r2';

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
    const captureDate =
      (formData.get('capture_date') as string) || new Date().toISOString().split('T')[0];
    const mediaType = (formData.get('media_type') as 'image' | 'video') || 'image';
    const isFeatured = formData.get('is_featured') === 'true';
    const isPublished = formData.get('is_published') !== 'false';

    let storagePath = (formData.get('storage_path') as string) || '';
    let thumbnailPath = (formData.get('thumbnail_path') as string) || storagePath;
    let youtubeVideoId: string | null = null;

    // ── YOUTUBE VIDEO BRANCH ────────────────────────────────────────────────────
    // When admin pastes a YouTube URL, we store the video ID and derive embed/thumbnail URLs.
    const youtubeUrl = (formData.get('youtube_url') as string) || '';
    if (mediaType === 'video' && youtubeUrl) {
      const extractedId = extractYouTubeId(youtubeUrl);
      if (!extractedId) {
        return NextResponse.json(
          { error: 'Invalid YouTube URL. Please paste a valid YouTube video link.' },
          { status: 400 }
        );
      }

      youtubeVideoId = extractedId;
      storagePath = getYouTubeEmbedUrl(extractedId); // embed URL stored for backward compat
      thumbnailPath = getYouTubeThumbnail(extractedId); // auto-generated YouTube thumbnail
    }

    // ── IMAGE UPLOAD BRANCH ─────────────────────────────────────────────────────
    // For images: client uploads directly to Cloudinary and sends back the public URL.
    // If no storage_path yet and there IS a raw file, upload it server-side.
    if (!storagePath && mediaType === 'image' && file && file.size > 0) {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let uploadedSuccessfully = false;

      // ── Try Cloudflare R2 first ──────────────────────────────────────────────
      if (isR2Configured()) {
        try {
          const key = buildR2Key('photos', sanitizedName);
          const r2Url = await uploadBufferToR2(buffer, key, file.type || 'image/jpeg');
          storagePath = r2Url;
          thumbnailPath = r2Url; // R2 doesn't do transformations — use same URL
          uploadedSuccessfully = true;
        } catch (err: any) {
          console.warn('R2 server-side upload failed, trying Supabase:', err?.message);
        }
      }

      // ── Fallback: Supabase Storage ───────────────────────────────────────────
      if (!uploadedSuccessfully) {
        const adminSupabase = createAdminSupabaseClient();
        if (adminSupabase) {
          try {
            const filePath = `images/${timestamp}_${sanitizedName}`;
            const { data: uploadData, error: uploadErr } = await adminSupabase.storage
              .from('festival-media')
              .upload(filePath, buffer, { contentType: file.type, upsert: true });

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
                  .upload(thumbPath, thumbBuffer, { contentType: 'image/webp', upsert: true });
                if (thumbUploadData) {
                  const { data: thumbPublicUrlData } = adminSupabase.storage
                    .from('festival-media')
                    .getPublicUrl(thumbPath);
                  thumbnailPath = thumbPublicUrlData.publicUrl;
                }
              }
            } else if (uploadErr) {
              console.warn(
                'Supabase storage upload error, using local fallback:',
                uploadErr.message
              );
            }
          } catch (err: any) {
            console.warn('Supabase storage exception, using local fallback:', err?.message || err);
          }
        }
      }

      // ── Last resort: Local disk ──────────────────────────────────────────────
      if (!uploadedSuccessfully) {
        const localPath = saveFileLocally(buffer, 'images', `${timestamp}_${sanitizedName}`);
        if (localPath) {
          storagePath = localPath;
          thumbnailPath = localPath;
        }

        if (thumbnailFile && thumbnailFile.size > 0) {
          const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
          const localThumbPath = saveFileLocally(
            thumbBuffer,
            'thumbnails',
            `${timestamp}_thumb.webp`
          );
          if (localThumbPath) thumbnailPath = localThumbPath;
        }
      }
    }

    // ── Legacy video branch: Supabase file upload (old behaviour, preserved for backward compat)
    if (!storagePath && !youtubeVideoId && mediaType === 'video' && file && file.size > 0) {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `videos/${timestamp}_${sanitizedName}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const adminSupabase = createAdminSupabaseClient();
      if (adminSupabase) {
        try {
          const { data: uploadData, error: uploadErr } = await adminSupabase.storage
            .from('festival-media')
            .upload(filePath, buffer, { contentType: file.type, upsert: true });

          if (!uploadErr && uploadData) {
            const { data: publicUrlData } = adminSupabase.storage
              .from('festival-media')
              .getPublicUrl(filePath);
            storagePath = publicUrlData.publicUrl;
            thumbnailPath = storagePath;
          }
        } catch (err: any) {
          console.warn('Supabase video upload exception:', err?.message || err);
        }
      }

      if (!storagePath) {
        const localPath = saveFileLocally(buffer, 'videos', `${timestamp}_${sanitizedName}`);
        if (localPath) {
          storagePath = localPath;
          thumbnailPath = localPath;
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
      youtube_video_id: youtubeVideoId || undefined,
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
      details: {
        title,
        mediaType,
        festivalYearId,
        isPublished,
        source: youtubeVideoId ? 'youtube' : isR2Configured() ? 'r2' : 'supabase',
      },
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, memory: createdMemory });
  } catch (err: any) {
    console.error('Upload endpoint error:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload memory' }, { status: 500 });
  }
}
