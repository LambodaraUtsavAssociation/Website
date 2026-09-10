/**
 * Server-side Cloudflare R2 upload utilities.
 * R2 is S3-compatible, so we use the AWS SDK v3 with a custom R2 endpoint.
 * Used only in API routes — never imported client-side (contains secrets).
 *
 * Free tier: 10 GB storage, 1M Class A ops, 10M Class B ops/month, ZERO egress fees.
 *
 * Setup:
 *  1. Create an R2 bucket in Cloudflare dashboard
 *  2. Enable "Public access" on the bucket (or set up a custom domain)
 *  3. Create an R2 API Token with Object Read & Write permissions
 *  4. Set the 4 env vars below in .env.local
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, ''); // e.g. https://pub-xxx.r2.dev or https://media.yourdomain.com

/**
 * Checks that all required R2 environment variables are set.
 */
export function isR2Configured(): boolean {
  return !!(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET_NAME &&
    R2_PUBLIC_URL
  );
}

/**
 * Creates a configured S3Client pointed at Cloudflare R2.
 */
function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Generates a presigned PUT URL so the browser can upload an image directly to R2.
 * This bypasses Vercel's 4.5MB serverless payload limit — same pattern as our Supabase signed URL approach.
 *
 * @param key - The R2 object key (e.g., 'festival-media/2026/photo.jpg')
 * @param contentType - MIME type of the file (e.g., 'image/jpeg')
 * @param expiresInSeconds - How long the presigned URL is valid (default 5 min)
 * @returns The presigned PUT URL + the final public URL after upload
 */
export async function generateR2PresignedUpload(
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<{
  presignedUrl: string;
  publicUrl: string;
  key: string;
}> {
  if (!isR2Configured()) {
    throw new Error(
      'Cloudflare R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL in your .env.local file.'
    );
  }

  const client = createR2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  return { presignedUrl, publicUrl, key };
}

/**
 * Uploads a file buffer directly to R2 from the server.
 * Used as a server-side fallback when client-side direct upload isn't available.
 *
 * @param buffer - The image file buffer
 * @param key - R2 object key (e.g., 'festival-media/2026/photo.jpg')
 * @param contentType - MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const client = createR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Builds the R2 object key for a festival media file.
 * Pattern: festival-media/{year}/{type}/{timestamp}_{filename}
 *
 * @param folder - Subfolder (e.g., 'photos', 'thumbnails')
 * @param fileName - Original file name
 */
export function buildR2Key(folder: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `festival-media/${folder}/${timestamp}_${sanitized}`;
}

/**
 * Deletes an object from Cloudflare R2 given its public URL or key.
 */
export async function deleteR2Object(urlOrKey: string): Promise<boolean> {
  if (!isR2Configured() || !urlOrKey) return false;

  let key = urlOrKey;
  if (urlOrKey.startsWith('http')) {
    try {
      const parsed = new URL(urlOrKey);
      key = parsed.pathname.replace(/^\//, '');
    } catch {
      return false;
    }
  }

  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = createR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.warn('Failed to delete object from R2:', err);
    return false;
  }
}
