import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { generateR2PresignedUpload, isR2Configured, buildR2Key } from '@/lib/r2';
import { checkRateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rateLimit';

/**
 * POST /api/admin/r2/upload-url
 *
 * Returns a presigned PUT URL so the browser can upload an image file
 * DIRECTLY to Cloudflare R2 — bypassing Vercel's 4.5MB serverless payload limit.
 * Same pattern as the Supabase signed URL route (/api/admin/storage/upload-url).
 *
 * Request body: { folder: string, fileName: string, contentType: string }
 * Response:     { presignedUrl: string, publicUrl: string, key: string }
 */
export async function POST(request: NextRequest) {
  const rlResult = checkRateLimit(request, RATE_LIMITS.ADMIN_MUTATIONS, 'r2-upload-url');
  if (!rlResult.success) {
    return rateLimitExceededResponse(rlResult);
  }

  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          'Cloudflare R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL in your .env.local file.',
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const folder = (body.folder as string) || 'photos';
    const fileName = (body.fileName as string) || `file_${Date.now()}.bin`;
    const contentType = (body.contentType as string) || 'application/octet-stream';

    const key = buildR2Key(folder, fileName);
    const result = await generateR2PresignedUpload(key, contentType);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('R2 upload-url error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate R2 presigned upload URL' },
      { status: 500 }
    );
  }
}
