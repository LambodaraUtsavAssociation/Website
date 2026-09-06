import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { reorderMemories } from '@/lib/data/repository';
import { logAuditEvent } from '@/lib/telemetry';

export async function POST(request: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const { orderedIds } = await request.json();
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'Array of ordered memory IDs required' }, { status: 400 });
    }

    await reorderMemories(orderedIds);

    logAuditEvent({
      action: 'REORDER_MEMORIES',
      targetEntity: 'Memory',
      request,
      details: { count: orderedIds.length },
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, message: 'Memories reordered successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reorder memories' }, { status: 500 });
  }
}
