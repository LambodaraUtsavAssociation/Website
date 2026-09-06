import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { createFestivalYear } from '@/lib/data/repository';
import { logAuditEvent } from '@/lib/telemetry';

export async function POST(request: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const yearNumber = Number(body.year);
    if (!yearNumber || isNaN(yearNumber)) {
      return NextResponse.json({ error: 'Valid festival year is required' }, { status: 400 });
    }

    const createdYear = await createFestivalYear({
      year: yearNumber,
      title: body.title || `Vinayaka Chavithi ${yearNumber}`,
      slug: body.slug || `${yearNumber}`,
      description: body.description || '',
      cover_image_url: body.cover_image_url || 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=2000&auto=format&fit=crop',
      is_published: body.is_published !== false,
    });

    logAuditEvent({
      action: 'CREATE_FESTIVAL_YEAR',
      targetEntity: 'FestivalYear',
      entityId: createdYear.id,
      request,
      details: { year: yearNumber, title: createdYear.title },
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, year: createdYear });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create festival year' }, { status: 500 });
  }
}
