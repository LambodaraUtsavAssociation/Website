import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { updateFestivalYear, deleteFestivalYear } from '@/lib/data/repository';
import { logAuditEvent } from '@/lib/telemetry';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const updates = await request.json();
    const updated = await updateFestivalYear(params.id, updates);

    logAuditEvent({
      action: 'UPDATE_FESTIVAL_YEAR',
      targetEntity: 'FestivalYear',
      entityId: params.id,
      request,
      details: updates,
    });

    revalidatePath('/', 'layout');

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
    await deleteFestivalYear(params.id);

    logAuditEvent({
      action: 'DELETE_FESTIVAL_YEAR',
      targetEntity: 'FestivalYear',
      entityId: params.id,
      request,
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, message: 'Festival year deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete year' }, { status: 500 });
  }
}
