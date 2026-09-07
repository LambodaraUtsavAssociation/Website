import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getBlessingCounts, toggleBlessing } from '@/lib/data/blessingsStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const counts = getBlessingCounts();
  return NextResponse.json({ success: true, blessings: counts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memoryId, action } = body as { memoryId: string; action: 'bless' | 'unbless' };

    if (!memoryId) {
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 });
    }

    const newCount = toggleBlessing(memoryId, action === 'unbless' ? 'unbless' : 'bless');
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      memoryId,
      count: newCount,
    });
  } catch (err: any) {
    console.error('Failed to toggle blessing:', err);
    return NextResponse.json({ error: err.message || 'Failed to update blessing' }, { status: 500 });
  }
}
