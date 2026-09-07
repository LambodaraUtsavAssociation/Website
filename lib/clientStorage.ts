import { createClient } from './supabase/client';

export async function uploadFileToSupabaseStorage(
  file: File,
  bucketName: 'festival-media' | 'hero-section',
  folderPrefix: string
): Promise<string | null> {
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${folderPrefix}/${timestamp}_${sanitizedName}`;
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (error || !data) {
      console.warn(`Direct client storage upload to ${bucketName}/${filePath} failed:`, error?.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrlData.publicUrl || null;
  } catch (err) {
    console.warn('Direct client storage upload exception:', err);
    return null;
  }
}
