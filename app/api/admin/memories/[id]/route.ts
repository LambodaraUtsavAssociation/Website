import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { updateMemory, deleteMemory } from '@/lib/data/repository';
import { logAuditEvent } from '@/lib/telemetry';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const updates = await request.json();
    const updated = await updateMemory(params.id, updates);

    logAuditEvent({
      action: 'UPDATE_MEMORY',
      targetEntity: 'Memory',
      entityId: params.id,
      request,
      details: updates,
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, memory: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update memory' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    await deleteMemory(params.id);

    logAuditEvent({
      action: 'DELETE_MEMORY',
      targetEntity: 'Memory',
      entityId: params.id,
      request,
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, message: 'Memory deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete memory' }, { status: 500 });
  }
}
