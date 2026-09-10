import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const rlResult = checkRateLimit(request, RATE_LIMITS.ADMIN_MUTATIONS, 'storage-upload-url');
  if (!rlResult.success) {
    return rateLimitExceededResponse(rlResult);
  }

  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bucket = 'festival-media', folderPrefix = 'images', fileName, contentType } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    const adminSupabase = createAdminSupabaseClient();
    if (!adminSupabase) {
      return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
    }

    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${folderPrefix}/${timestamp}_${sanitizedName}`;

    // Create signed upload URL with admin service role privileges
    const { data, error } = await adminSupabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed upload URL:', error);
      return NextResponse.json(
        { error: error?.message || 'Failed to create signed upload URL' },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = adminSupabase.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err: any) {
    console.error('Signed upload URL exception:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate signed upload URL' },
      { status: 500 }
    );
  }
}
