import { createClient } from './supabase/client';

/**
 * Uploads a file directly to Supabase Storage using an admin-signed URL.
 * Bypasses Vercel serverless request body size limits (4.5 MB) completely,
 * allowing video clips and photos of any size (up to 500MB+) to upload cleanly.
 */
export async function uploadFileWithSignedUrl(
  file: File | Blob,
  bucketName: 'festival-media' | 'hero-section',
  folderPrefix: string,
  fileName?: string
): Promise<string> {
  const nameToUse = fileName || (file as File).name || `file_${Date.now()}.webp`;
  const contentType = file.type || 'application/octet-stream';

  // 1. Request Signed Upload URL from serverless endpoint (lightweight ~100 bytes JSON request)
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

  // 2. Direct PUT request from browser directly to Supabase Storage endpoint (bypasses Vercel)
  const uploadRes = await fetch(urlData.signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Direct storage upload failed (${uploadRes.status}): ${errorText}`);
  }

  return urlData.publicUrl;
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
