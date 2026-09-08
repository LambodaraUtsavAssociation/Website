/**
 * Uploads a file directly to Supabase Storage using an admin-signed URL.
 * Bypasses Vercel serverless request body size limits (4.5 MB) completely,
 * allowing video clips and photos of any size (up to 500MB+) to upload cleanly.
 *
 * Features:
 * - Retry logic with exponential backoff (3 attempts) — handles mobile network drops
 * - 120-second AbortController timeout per attempt — prevents indefinite hangs on slow connections
 * - iOS-compatible: works with video/quicktime, video/mp4, image/* MIME types
 */

const UPLOAD_TIMEOUT_MS = 120_000; // 120 seconds per attempt
const MAX_RETRIES = 3;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadWithRetry(
  signedUrl: string,
  file: File | Blob,
  contentType: string,
  attempt = 1
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const res = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err?.name === 'AbortError';
    const isNetwork = err?.name === 'TypeError' || err?.name === 'NetworkError';

    if ((isAbort || isNetwork) && attempt < MAX_RETRIES) {
      const backoffMs = Math.min(1000 * 2 ** (attempt - 1), 8000); // 1s, 2s, 4s
      console.warn(`Upload attempt ${attempt} failed (${err?.name}). Retrying in ${backoffMs}ms...`);
      await delay(backoffMs);
      return uploadWithRetry(signedUrl, file, contentType, attempt + 1);
    }

    throw new Error(
      isAbort
        ? `Upload timed out after ${UPLOAD_TIMEOUT_MS / 1000}s on attempt ${attempt}. Check your network connection.`
        : err?.message || 'Network error during upload'
    );
  }
}

export async function uploadFileWithSignedUrl(
  file: File | Blob,
  bucketName: 'festival-media' | 'hero-section',
  folderPrefix: string,
  fileName?: string
): Promise<string> {
  const nameToUse = fileName || (file as File).name || `file_${Date.now()}.bin`;

  // iOS Safari often reports video/quicktime for .mp4 — normalize to video/mp4 for Supabase compatibility
  let contentType = file.type || 'application/octet-stream';
  if (contentType === 'video/quicktime') {
    contentType = 'video/mp4';
  }

  // Step 1: Request a signed upload URL (lightweight JSON request to our serverless route)
  const urlRes = await fetch('/api/admin/storage/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket: bucketName,
      folderPrefix,
      fileName: nameToUse,
      contentType,
    }),
  });

  const urlData = await urlRes.json();
  if (!urlRes.ok || !urlData.signedUrl) {
    throw new Error(urlData.error || 'Failed to generate signed upload URL');
  }

  // Step 2: PUT directly from browser to Supabase Storage (bypasses Vercel entirely)
  // Uses retry logic with exponential backoff to handle mobile network drops
  const uploadRes = await uploadWithRetry(urlData.signedUrl, file, contentType);

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text().catch(() => 'Unknown error');
    throw new Error(`Storage upload failed (HTTP ${uploadRes.status}): ${errorText}`);
  }

  return urlData.publicUrl as string;
}

export async function uploadFileToSupabaseStorage(
  file: File,
  bucketName: 'festival-media' | 'hero-section',
  folderPrefix: string
): Promise<string | null> {
  try {
    return await uploadFileWithSignedUrl(file, bucketName, folderPrefix);
  } catch (err: any) {
    console.warn('Fallback direct storage upload exception:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOUDFLARE R2 — Direct browser-to-R2 upload via presigned PUT URL
// Same pattern as the Supabase signed URL approach above.
// R2 is S3-compatible → zero egress fees, 10 GB free storage/month.
// ─────────────────────────────────────────────────────────────────────────────

export interface R2UploadResult {
  /** Full public R2 URL */
  publicUrl: string;
  /** Same URL — R2 doesn't do server-side transformations; use Next.js Image for resizing */
  thumbnailUrl: string;
}

/**
 * Uploads an image directly from the browser to Cloudflare R2 using a presigned PUT URL.
 *
 * Flow:
 *  1. Requests a presigned PUT URL from /api/admin/r2/upload-url (lightweight server call)
 *  2. PUTs the image directly to R2 from the browser (bypasses Vercel entirely)
 *
 * @param file   - The image File object to upload
 * @param folder - R2 subfolder (e.g., 'photos', 'hero-media')
 * @returns Public R2 URL (both publicUrl and thumbnailUrl point to the same file)
 */
export async function uploadImageToR2(
  file: File,
  folder = 'photos'
): Promise<R2UploadResult> {
  // Step 1: Get presigned PUT URL + final public URL from our API route
  const paramRes = await fetch('/api/admin/r2/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      folder,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
    }),
  });

  const paramData = await paramRes.json();
  if (!paramRes.ok || !paramData.presignedUrl) {
    throw new Error(paramData.error || 'Failed to get R2 presigned upload URL');
  }

  const { presignedUrl, publicUrl } = paramData;

  // Step 2: PUT the file directly to R2 — bypasses Vercel, no size limit
  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => 'Unknown error');
    throw new Error(`R2 upload failed (HTTP ${uploadRes.status}): ${errText}`);
  }

  // R2 doesn't do server-side image transformations — thumbnailUrl = same as publicUrl
  // Next.js <Image> handles client-side resize/optimization automatically via its built-in optimizer
  return { publicUrl, thumbnailUrl: publicUrl };
}
