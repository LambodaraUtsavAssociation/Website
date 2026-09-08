import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { updateFestivalYear, deleteFestivalYear, getFestivalYearById } from '@/lib/data/repository';
import { deleteR2Object } from '@/lib/r2';
import { logAuditEvent } from '@/lib/telemetry';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const updates = await request.json();

    // If cover image is being updated/replaced, clean up old Cloudflare R2 object to prevent duplicate files
    if (updates.cover_image_url !== undefined) {
      const existingYear = await getFestivalYearById(params.id);
      if (
        existingYear?.cover_image_url &&
        updates.cover_image_url !== existingYear.cover_image_url
      ) {
        await deleteR2Object(existingYear.cover_image_url).catch((err) => {
          console.warn('Failed to delete old festival cover from R2:', err);
        });
      }
    }

    const updated = await updateFestivalYear(params.id, updates);

    logAuditEvent({
      action: 'UPDATE_FESTIVAL_YEAR',
      targetEntity: 'FestivalYear',
      entityId: params.id,
      request,
      details: updates,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/years');

    return NextResponse.json({ success: true, year: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update year' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const existingYear = await getFestivalYearById(params.id);
    if (existingYear?.cover_image_url) {
      await deleteR2Object(existingYear.cover_image_url).catch(() => null);
    }

    await deleteFestivalYear(params.id);

    logAuditEvent({
      action: 'DELETE_FESTIVAL_YEAR',
      targetEntity: 'FestivalYear',
      entityId: params.id,
      request,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/years');

    return NextResponse.json({ success: true, message: 'Festival year deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete year' }, { status: 500 });
  }
}
