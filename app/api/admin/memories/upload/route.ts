import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { createMemory } from '@/lib/data/repository';
import { logAuditEvent } from '@/lib/telemetry';

export async function POST(request: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const title = (formData.get('title') as string) || 'Untitled Memory';
    const description = (formData.get('description') as string) || '';
    const festivalYearId = (formData.get('festival_year_id') as string) || '';
    const categoryId = (formData.get('category_id') as string) || '';
    const captureDate = (formData.get('capture_date') as string) || new Date().toISOString().split('T')[0];
    const mediaType = (formData.get('media_type') as 'image' | 'video') || 'image';
    const isFeatured = formData.get('is_featured') === 'true';
    const isPublished = formData.get('is_published') !== 'false';

    let storagePath = 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=1600&auto=format&fit=crop';
    let thumbnailPath = storagePath;

    if (file) {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      storagePath = `/uploads/${mediaType}s/${timestamp}_${sanitizedName}`;
      thumbnailPath = storagePath;
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
    return NextResponse.json({ error: err.message || 'Failed to upload memory' }, { status: 500 });
  }
}
