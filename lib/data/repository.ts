import { Category, FestivalYear, Memory, AdminOverviewStats, MemoryFormData } from '@/types';
import { INITIAL_CATEGORIES, INITIAL_YEARS, INITIAL_MEMORIES } from './mockData';
import { createClient } from '../supabase/client';
import { createAdminSupabaseClient } from '../supabase/admin';
import { getDisplayFestivalYear } from '../festivalDates';
import { getBlessingCounts } from './blessingsStore';

function getSupabaseMutationClient() {
  const admin = createAdminSupabaseClient();
  return admin || createClient();
}

let localYears: FestivalYear[] = [...INITIAL_YEARS];
let localCategories: Category[] = [...INITIAL_CATEGORIES];
let localMemories: Memory[] = [...INITIAL_MEMORIES];

// ── In-Memory SWR Cache & In-Flight Promise Pooling ─────────────────────────
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const repositoryMemoryCache = new Map<string, CacheEntry<any>>();
const inFlightPromises = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function invalidateRepositoryCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    repositoryMemoryCache.clear();
    inFlightPromises.clear();
    return;
  }
  for (const k of Array.from(repositoryMemoryCache.keys())) {
    if (k.startsWith(keyPrefix)) repositoryMemoryCache.delete(k);
  }
  for (const k of Array.from(inFlightPromises.keys())) {
    if (k.startsWith(keyPrefix)) inFlightPromises.delete(k);
  }
}

async function fetchWithDeduplication<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs = CACHE_TTL_MS
): Promise<T> {
  const cached = repositoryMemoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }

  const existingPromise = inFlightPromises.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  const p = fetchFn()
    .then((result) => {
      repositoryMemoryCache.set(key, { data: result, timestamp: Date.now() });
      inFlightPromises.delete(key);
      return result;
    })
    .catch((err) => {
      inFlightPromises.delete(key);
      throw err;
    });

  inFlightPromises.set(key, p);
  return p;
}

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes('demo-Vinayaka-Chavithi');
}

export async function getFestivalYears(onlyPublished = true): Promise<FestivalYear[]> {
  const cacheKey = `years:${onlyPublished}`;
  return fetchWithDeduplication(cacheKey, async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseMutationClient();
        let query = supabase.from('festival_years').select('*').order('year', { ascending: false });
        if (onlyPublished) {
          query = query.eq('is_published', true);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as FestivalYear[];
        }
      } catch {
        // Fallback
      }
    }

    const years = onlyPublished ? localYears.filter((y) => y.is_published) : localYears;
    return years.map((y) => {
      const yearMemories = localMemories.filter(
        (m) => m.festival_year_id === y.id && (onlyPublished ? m.is_published : true)
      );
      return {
        ...y,
        memory_count: yearMemories.length,
        photo_count: yearMemories.filter((m) => m.media_type === 'image').length,
        video_count: yearMemories.filter((m) => m.media_type === 'video').length,
      };
    });
  });
}

export async function getActiveFestivalYear(): Promise<FestivalYear | null> {
  const years = await getFestivalYears(true);
  return getDisplayFestivalYear(years);
}

export async function getFestivalYearBySlug(slug: string): Promise<FestivalYear | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseMutationClient();
      const { data, error } = await supabase
        .from('festival_years')
        .select('*')
        .eq('slug', slug)
        .single();
      if (!error && data) return data as FestivalYear;
    } catch {
      // Fallback
    }
  }

  const year = localYears.find((y) => y.slug === slug || y.year.toString() === slug);
  if (!year) return null;

  const yearMemories = localMemories.filter(
    (m) => m.festival_year_id === year.id && m.is_published
  );
  return {
    ...year,
    memory_count: yearMemories.length,
    photo_count: yearMemories.filter((m) => m.media_type === 'image').length,
    video_count: yearMemories.filter((m) => m.media_type === 'video').length,
  };
}

export async function getFestivalYearById(id: string): Promise<FestivalYear | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseMutationClient();
      const { data, error } = await supabase
        .from('festival_years')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data as FestivalYear;
    } catch {
      // Fallback
    }
  }

  return localYears.find((y) => y.id === id) || null;
}

export async function getCategories(): Promise<Category[]> {
  return fetchWithDeduplication('categories', async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseMutationClient();
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) return data as Category[];
      } catch {
        // Fallback
      }
    }
    return [...localCategories].sort((a, b) => a.display_order - b.display_order);
  });
}

export async function getMemories(options?: {
  yearId?: string;
  yearSlug?: string;
  categorySlug?: string;
  mediaType?: 'image' | 'video';
  featuredOnly?: boolean;
  onlyPublished?: boolean;
}): Promise<Memory[]> {
  const cacheKey = `memories:${JSON.stringify(options || {})}`;
  return fetchWithDeduplication(cacheKey, async () => {
    const {
      yearId,
      yearSlug,
      categorySlug,
      mediaType,
      featuredOnly,
      onlyPublished = true,
    } = options || {};
    const blessingCounts = getBlessingCounts();

    const attachBlessingsAndSort = (memList: Memory[]): Memory[] => {
      const listWithBlessings = memList.map((m) => ({
        ...m,
        blessing_count: blessingCounts[m.id] || m.blessing_count || 0,
      }));

      return listWithBlessings.sort((a, b) => {
        const bCountDiff = (b.blessing_count || 0) - (a.blessing_count || 0);
        if (bCountDiff !== 0) return bCountDiff; // Highest blessed first!
        return a.display_order - b.display_order;
      });
    };

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseMutationClient();
        let query = supabase
          .from('memories')
          .select('*, category:categories(*)')
          .order('display_order', { ascending: true });

        if (onlyPublished) query = query.eq('is_published', true);
        if (featuredOnly) query = query.eq('is_featured', true);
        if (mediaType) query = query.eq('media_type', mediaType);
        if (yearId) query = query.eq('festival_year_id', yearId);

        if (categorySlug && categorySlug !== 'all') {
          const catsInDb = await getCategories();
          const targetCat = catsInDb.find((c) => c.slug === categorySlug);
          if (targetCat) {
            query = query.eq('category_id', targetCat.id);
          }
        }

        const { data, error } = await query;
        if (!error && data) {
          let result = data as Memory[];
          if (categorySlug && categorySlug !== 'all') {
            result = result.filter((m) => m.category?.slug === categorySlug || m.category_id);
          }
          return attachBlessingsAndSort(result);
        }
      } catch {
        // Fallback
      }
    }

    let list = [...localMemories];

    if (onlyPublished) list = list.filter((m) => m.is_published);
    if (featuredOnly) list = list.filter((m) => m.is_featured);
    if (mediaType) list = list.filter((m) => m.media_type === mediaType);

    if (yearId) {
      list = list.filter((m) => m.festival_year_id === yearId);
    } else if (yearSlug) {
      const targetYear = localYears.find(
        (y) => y.slug === yearSlug || y.year.toString() === yearSlug
      );
      if (targetYear) {
        list = list.filter((m) => m.festival_year_id === targetYear.id);
      }
    }

    if (categorySlug && categorySlug !== 'all') {
      list = list.filter((m) => m.category?.slug === categorySlug);
    }

    return attachBlessingsAndSort(list);
  });
}

export async function getFeaturedMemories(limit = 6): Promise<Memory[]> {
  const memories = await getMemories({ featuredOnly: true, onlyPublished: true });
  if (memories.length > 0) return memories.slice(0, limit);
  const allPublished = await getMemories({ onlyPublished: true });
  return allPublished.slice(0, limit);
}

export async function getFeaturedVideo(): Promise<Memory | null> {
  const videos = await getMemories({ mediaType: 'video', onlyPublished: true });
  if (videos.length === 0) return null;
  const featured = videos.find((v) => v.is_featured);
  return featured || videos[0];
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const years = await getFestivalYears(false);
  const memories = await getMemories({ onlyPublished: false });

  const activeYear = await getActiveFestivalYear();
  const currentYearMemories = activeYear
    ? memories.filter((m) => m.festival_year_id === activeYear.id).length
    : 0;

  return {
    totalYears: years.length,
    totalMemories: memories.length,
    totalPhotos: memories.filter((m) => m.media_type === 'image').length,
    totalVideos: memories.filter((m) => m.media_type === 'video').length,
    currentYearMemories,
  };
}

export async function createFestivalYear(
  data: Omit<FestivalYear, 'id' | 'created_at' | 'updated_at'>
): Promise<FestivalYear> {
  const newYear: FestivalYear = {
    ...data,
    id: `fy-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseMutationClient();
      const { category, festival_year, ...cleanPayload } = newYear as any;
      // Omit custom id if not valid UUID
      if (!cleanPayload.id.includes('-') || cleanPayload.id.startsWith('fy-')) {
        delete cleanPayload.id;
      }
      const { data: created, error } = await supabase
        .from('festival_years')
        .insert([cleanPayload])
        .select()
        .single();
      if (error) {
        console.error('Supabase createFestivalYear error:', error);
      } else if (created) {
        invalidateRepositoryCache('years');
        return created as FestivalYear;
      }
    } catch (err) {
      console.error('createFestivalYear catch:', err);
    }
  }

  localYears.unshift(newYear);
  invalidateRepositoryCache('years');
  return newYear;
}

export async function updateFestivalYear(
  id: string,
  updates: Partial<FestivalYear>
): Promise<FestivalYear | null> {
  const updated_at = new Date().toISOString();
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseMutationClient();
      const { data, error } = await supabase
        .from('festival_years')
        .update({ ...updates, updated_at })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Supabase updateFestivalYear error:', error);
      } else if (data) {
        invalidateRepositoryCache('years');
        return data as FestivalYear;
      }
    } catch (err) {
      console.error('updateFestivalYear catch:', err);
    }
  }

  const idx = localYears.findIndex((y) => y.id === id);
  if (idx === -1) return null;
  localYears[idx] = { ...localYears[idx], ...updates, updated_at };
  invalidateRepositoryCache('years');
  return localYears[idx];
}

export async function deleteFestivalYear(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseMutationClient();

      // Clean up all memories associated with this festival year first (deleting R2 files)
      const { data: yearMems } = await supabase
        .from('memories')
        .select('id')
        .eq('festival_year_id', id);

      if (yearMems && yearMems.length > 0) {
        for (const m of yearMems) {
          await deleteMemory(m.id);
        }
      }

      const { error } = await supabase.from('festival_years').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteFestivalYear error:', error);
      } else {
        invalidateRepositoryCache('years');
        invalidateRepositoryCache('memories');
        return true;
      }
    } catch (err) {
      console.error('deleteFestivalYear catch:', err);
    }
  }

  localYears = localYears.filter((y) => y.id !== id);
  localMemories = localMemories.filter((m) => m.festival_year_id !== id);
  invalidateRepositoryCache('years');
  invalidateRepositoryCache('memories');
  return true;
}

export function generateMemorableMemoryId(festivalYearId: string, captureDate?: string): string {
  const yearObj = localYears.find((y) => y.id === festivalYearId);
  let yearNum = yearObj ? String(yearObj.year) : '';

  if (!yearNum && captureDate) {
    yearNum = captureDate.substring(0, 4);
  }

  if (!yearNum || isNaN(Number(yearNum))) {
    const match = festivalYearId ? festivalYearId.match(/\d{4}/) : null;
    if (match) {
      yearNum = match[0];
    } else {
      yearNum = new Date().getFullYear().toString();
    }
  }

  const yearMemoriesCount = localMemories.filter((m) => {
    const mYearObj = localYears.find((y) => y.id === m.festival_year_id);
    if (mYearObj && String(mYearObj.year) === yearNum) return true;
    if (m.festival_year_id === festivalYearId) return true;
    if (m.capture_date && m.capture_date.startsWith(yearNum)) return true;
    return false;
  }).length;

  const nextSeq = String(yearMemoriesCount + 1).padStart(3, '0');
  const baseId = `MEM-${yearNum}-${nextSeq}`;

  if (!localMemories.some((m) => m.id === baseId)) {
    return baseId;
  }

  const suffix = Math.floor(100 + Math.random() * 900);
  return `MEM-${yearNum}-${nextSeq}-${suffix}`;
}

function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function createMemory(
  formData: MemoryFormData & { customId?: string }
): Promise<Memory> {
  const categoryObj = localCategories.find((c) => c.id === formData.category_id);
  const yearObj = localYears.find((y) => y.id === formData.festival_year_id);
  const memorableId =
    formData.customId ||
    generateMemorableMemoryId(formData.festival_year_id, formData.capture_date);

  const fallbackMemory: Memory = {
    id: memorableId,
    festival_year_id: formData.festival_year_id,
    category_id: formData.category_id || null,
    media_type: formData.media_type,
    title: formData.title,
    telugu_title: formData.telugu_title || null,
    description: formData.description || null,
    telugu_description: formData.telugu_description || null,
    capture_date: formData.capture_date || new Date().toISOString().split('T')[0],
    storage_path: formData.storage_path,
    thumbnail_path: formData.thumbnail_path || formData.storage_path,
    card_path: formData.card_path || null,
    full_path: formData.full_path || null,
    youtube_video_id: formData.youtube_video_id || null,
    width: 1600,
    height: 1067,
    is_featured: formData.is_featured,
    is_published: formData.is_published,
    display_order: formData.display_order ?? localMemories.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: categoryObj || null,
    festival_year: yearObj || null,
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseMutationClient();

      // Resolve valid UUID for festival_year_id
      let validYearId: string | null = null;
      if (isUUID(formData.festival_year_id)) {
        validYearId = formData.festival_year_id;
      } else {
        const yearsInDb = await getFestivalYears(false);
        const matchYear = yearsInDb.find(
          (y) =>
            y.id === formData.festival_year_id || y.slug === '2026' || String(y.year) === '2026'
        );
        if (matchYear && isUUID(matchYear.id)) {
          validYearId = matchYear.id;
        }
      }

      // Resolve valid UUID for category_id
      let validCategoryId: string | null = null;
      if (isUUID(formData.category_id)) {
        validCategoryId = formData.category_id || null;
      } else if (formData.category_id) {
        const catsInDb = await getCategories();
        const matchCat = catsInDb.find(
          (c) =>
            c.id === formData.category_id ||
            c.slug === formData.category_id ||
            c.name === formData.category_id
        );
        if (matchCat && isUUID(matchCat.id)) {
          validCategoryId = matchCat.id;
        }
      }

      const dbPayload: Record<string, any> = {
        festival_year_id: validYearId,
        category_id: validCategoryId,
        media_type: formData.media_type,
        title: formData.title,
        telugu_title: formData.telugu_title || null,
        description: formData.description || null,
        telugu_description: formData.telugu_description || null,
        capture_date: formData.capture_date || new Date().toISOString().split('T')[0],
        storage_path: formData.storage_path,
        thumbnail_path: formData.thumbnail_path || formData.storage_path,
        card_path: formData.card_path || null,
        full_path: formData.full_path || null,
        youtube_video_id: formData.youtube_video_id || null,
        width: 1600,
        height: 1067,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
        display_order: formData.display_order ?? localMemories.length + 1,
      };

      const { data, error } = await supabase
        .from('memories')
        .insert([dbPayload])
        .select('*, category:categories(*)')
        .single();

      if (error) {
        console.error('Supabase createMemory DB error:', error.message, error);
      } else if (data) {
        invalidateRepositoryCache('memories');
        return data as Memory;
      }
    } catch (err) {
      console.error('createMemory catch error:', err);
    }
  }

  localMemories.push(fallbackMemory);
  invalidateRepositoryCache('memories');
  return fallbackMemory;
}

export async function getHeroBucketMedia(): Promise<
  { url: string; caption: string; alt: string; isVideo?: boolean }[]
> {
  const cacheKey = 'hero_bucket_media_items';
  return fetchWithDeduplication(cacheKey, async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseMutationClient();
        const { data: heroRows, error: heroErr } = await supabase
          .from('hero_media')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!heroErr && heroRows && heroRows.length > 0) {
          return heroRows.map((h: any) => ({
            url: h.url,
            caption: h.caption || 'Hero Slide',
            alt: h.alt || h.caption || 'Hero Slide',
            isVideo: !!h.is_video,
          }));
        }
      } catch (err) {
        console.warn('Supabase hero_media direct fetch warning:', err);
      }
    }

    // Client-side fallback if in browser
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/hero-media');
        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            return data.items;
          }
        }
      } catch {
        // Ignore fallback error
      }
    }

    return [];
  }, 120 * 1000);
}

export async function updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null> {
  const updated_at = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseMutationClient();
      const { category, festival_year, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from('memories')
        .update({ ...cleanUpdates, updated_at })
        .eq('id', id)
        .select('*, category:categories(*)')
        .single();

      if (error) {
        console.error('Supabase updateMemory error:', error);
      } else if (data) {
        invalidateRepositoryCache('memories');
        return data as Memory;
      }
    } catch (err) {
      console.error('updateMemory catch error:', err);
    }
  }

  const idx = localMemories.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const categoryObj = updates.category_id
    ? localCategories.find((c) => c.id === updates.category_id)
    : localMemories[idx].category;
  localMemories[idx] = {
    ...localMemories[idx],
    ...updates,
    updated_at,
    category: categoryObj || localMemories[idx].category,
  };
  invalidateRepositoryCache('memories');
  return localMemories[idx];
}

export async function deleteMemory(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseMutationClient();

      // 1. Fetch memory record first to identify storage file paths for removal
      const { data: mem } = await supabase.from('memories').select('*').eq('id', id).single();

      if (mem) {
        // Clean up Cloudflare R2 objects if applicable
        try {
          const { deleteR2Object } = await import('../r2');
          if (mem.storage_path) await deleteR2Object(mem.storage_path);
          if (mem.thumbnail_path && mem.thumbnail_path !== mem.storage_path) {
            await deleteR2Object(mem.thumbnail_path);
          }
        } catch (r2Err) {
          console.warn('R2 memory cleanup warning:', r2Err);
        }

        const pathsToRemove: string[] = [];
        [mem.storage_path, mem.thumbnail_path].forEach((url) => {
          if (url && url.includes('/festival-media/')) {
            const parts = url.split('/festival-media/');
            if (parts[1]) {
              const cleanPath = parts[1].split('?')[0];
              if (!pathsToRemove.includes(cleanPath)) {
                pathsToRemove.push(cleanPath);
              }
            }
          }
        });

        // Remove files from Supabase Storage if legacy file exists
        if (pathsToRemove.length > 0) {
          try {
            await supabase.storage.from('festival-media').remove(pathsToRemove);
          } catch (storageErr) {
            console.error('Storage file deletion error:', storageErr);
          }
        }
      }

      // 2. Delete database row
      const { error } = await supabase.from('memories').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteMemory error:', error);
      } else {
        invalidateRepositoryCache('memories');
        return true;
      }
    } catch (err) {
      console.error('deleteMemory catch error:', err);
    }
  }

  localMemories = localMemories.filter((m) => m.id !== id);
  invalidateRepositoryCache('memories');
  return true;
}

export async function reorderMemories(orderedIds: string[]): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseMutationClient();
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('memories')
          .update({ display_order: index + 1 })
          .eq('id', id)
      );
      await Promise.all(updates);
      invalidateRepositoryCache('memories');
    } catch (err) {
      console.error('reorderMemories catch error:', err);
    }
  }

  orderedIds.forEach((id, index) => {
    const mem = localMemories.find((m) => m.id === id);
    if (mem) {
      mem.display_order = index + 1;
    }
  });

  invalidateRepositoryCache('memories');
  return true;
}
