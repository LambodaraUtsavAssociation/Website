import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getStoredHeroMetadata } from '@/lib/data/heroMetadata';

export const dynamic = 'force-dynamic';

export async function POST() {
  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) {
    return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
  }

  // Fetch active memories from DB
  const { data: dbMemories } = await adminSupabase.from('memories').select('storage_path, thumbnail_path');
  const activeUrls = new Set<string>();

  (dbMemories || []).forEach((m: any) => {
    if (m.storage_path) activeUrls.add(m.storage_path.split('?')[0]);
    if (m.thumbnail_path) activeUrls.add(m.thumbnail_path.split('?')[0]);
  });

  const removedMediaFiles: string[] = [];

  // Inspect festival-media subfolders
  for (const folder of ['images', 'videos', 'thumbnails']) {
    const { data: files } = await adminSupabase.storage.from('festival-media').list(folder, { limit: 100 });
    if (files && files.length > 0) {
      for (const f of files) {
        if (!f.name || f.name.startsWith('.')) continue;
        const relativePath = `${folder}/${f.name}`;
        const { data: publicUrlData } = adminSupabase.storage.from('festival-media').getPublicUrl(relativePath);
        const publicUrl = publicUrlData.publicUrl.split('?')[0];

        // If this file is NOT referenced in any DB memory record, remove it from storage!
        if (!activeUrls.has(publicUrl)) {
          const { error } = await adminSupabase.storage.from('festival-media').remove([relativePath]);
          if (!error) {
            removedMediaFiles.push(relativePath);
          }
        }
      }
    }
  }

  // Inspect hero-section bucket files
  const heroMeta = getStoredHeroMetadata();
  const activeHeroUrls = new Set<string>(Object.keys(heroMeta));
  const removedHeroFiles: string[] = [];

  const possibleBuckets = ['hero-section', 'Hero Section', 'hero_section', 'hero-media'];
  for (const bucketName of possibleBuckets) {
    const { data: files } = await adminSupabase.storage.from(bucketName).list('', { limit: 100 });
    if (files && files.length > 0) {
      for (const f of files) {
        if (!f.name || f.name.startsWith('.')) continue;
        const { data: publicUrlData } = adminSupabase.storage.from(bucketName).getPublicUrl(f.name);
        const publicUrl = publicUrlData.publicUrl.split('?')[0];

        if (!activeHeroUrls.has(publicUrl) && !activeHeroUrls.has(f.name)) {
          const { error } = await adminSupabase.storage.from(bucketName).remove([f.name]);
          if (!error) {
            removedHeroFiles.push(f.name);
          }
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    removedMediaFiles,
    removedHeroFiles,
    message: `Cleaned ${removedMediaFiles.length} orphaned festival media files and ${removedHeroFiles.length} hero files from Supabase Storage.`,
  });
}

export async function GET() {
  return POST();
}
