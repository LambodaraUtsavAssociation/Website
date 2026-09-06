import { Category, FestivalYear, Memory, AdminOverviewStats, MemoryFormData } from '@/types';
import { INITIAL_CATEGORIES, INITIAL_YEARS, INITIAL_MEMORIES } from './mockData';
import { createClient } from '../supabase/client';
import { getDisplayFestivalYear } from '../festivalDates';

let localYears: FestivalYear[] = [...INITIAL_YEARS];
let localCategories: Category[] = [...INITIAL_CATEGORIES];
let localMemories: Memory[] = [...INITIAL_MEMORIES];

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes('demo-Vinayaka-Chavithi');
}

export async function getFestivalYears(onlyPublished = true): Promise<FestivalYear[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
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
}

export async function getActiveFestivalYear(): Promise<FestivalYear | null> {
  const years = await getFestivalYears(true);
  return getDisplayFestivalYear(years);
}

export async function getFestivalYearBySlug(slug: string): Promise<FestivalYear | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('festival_years').select('*').eq('slug', slug).single();
      if (!error && data) return data as FestivalYear;
    } catch {
      // Fallback
    }
  }

  const year = localYears.find((y) => y.slug === slug || y.year.toString() === slug);
  if (!year) return null;

  const yearMemories = localMemories.filter((m) => m.festival_year_id === year.id && m.is_published);
  return {
    ...year,
    memory_count: yearMemories.length,
    photo_count: yearMemories.filter((m) => m.media_type === 'image').length,
    video_count: yearMemories.filter((m) => m.media_type === 'video').length,
  };
}

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
      if (!error && data && data.length > 0) return data as Category[];
    } catch {
      // Fallback
    }
  }
  return [...localCategories].sort((a, b) => a.display_order - b.display_order);
}

export async function getMemories(options?: {
  yearId?: string;
  yearSlug?: string;
  categorySlug?: string;
  mediaType?: 'image' | 'video';
  featuredOnly?: boolean;
  onlyPublished?: boolean;
}): Promise<Memory[]> {
  const { yearId, yearSlug, categorySlug, mediaType, featuredOnly, onlyPublished = true } = options || {};

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from('memories').select('*, category:categories(*)').order('display_order', { ascending: true });

      if (onlyPublished) query = query.eq('is_published', true);
      if (featuredOnly) query = query.eq('is_featured', true);
      if (mediaType) query = query.eq('media_type', mediaType);
      if (yearId) query = query.eq('festival_year_id', yearId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let result = data as Memory[];
        if (categorySlug && categorySlug !== 'all') {
          result = result.filter((m) => m.category?.slug === categorySlug);
        }
        return result;
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
    const targetYear = localYears.find((y) => y.slug === yearSlug || y.year.toString() === yearSlug);
    if (targetYear) {
      list = list.filter((m) => m.festival_year_id === targetYear.id);
    }
  }

  if (categorySlug && categorySlug !== 'all') {
    list = list.filter((m) => m.category?.slug === categorySlug);
  }

  return list.sort((a, b) => a.display_order - b.display_order);
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

export async function createFestivalYear(data: Omit<FestivalYear, 'id' | 'created_at' | 'updated_at'>): Promise<FestivalYear> {
  const newYear: FestivalYear = {
    ...data,
    id: `fy-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: created, error } = await supabase.from('festival_years').insert([newYear]).select().single();
      if (!error && created) return created as FestivalYear;
    } catch {
      // Fallback
    }
  }

  localYears.unshift(newYear);
  return newYear;
}

export async function updateFestivalYear(id: string, updates: Partial<FestivalYear>): Promise<FestivalYear | null> {
  const updated_at = new Date().toISOString();
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('festival_years').update({ ...updates, updated_at }).eq('id', id).select().single();
      if (!error && data) return data as FestivalYear;
    } catch {
      // Fallback
    }
  }

  const idx = localYears.findIndex((y) => y.id === id);
  if (idx === -1) return null;
  localYears[idx] = { ...localYears[idx], ...updates, updated_at };
  return localYears[idx];
}

export async function deleteFestivalYear(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('festival_years').delete().eq('id', id);
      if (!error) return true;
    } catch {
      // Fallback
    }
  }

  localYears = localYears.filter((y) => y.id !== id);
  localMemories = localMemories.filter((m) => m.festival_year_id !== id);
  return true;
}

export async function createMemory(formData: MemoryFormData): Promise<Memory> {
  const categoryObj = localCategories.find((c) => c.id === formData.category_id);
  const yearObj = localYears.find((y) => y.id === formData.festival_year_id);

  const newMemory: Memory = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    festival_year_id: formData.festival_year_id,
    category_id: formData.category_id || null,
    media_type: formData.media_type,
    title: formData.title,
    description: formData.description || null,
    capture_date: formData.capture_date || new Date().toISOString().split('T')[0],
    storage_path: formData.storage_path,
    thumbnail_path: formData.thumbnail_path || formData.storage_path,
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
      const supabase = createClient();
      const { data, error } = await supabase.from('memories').insert([newMemory]).select('*, category:categories(*)').single();
      if (!error && data) return data as Memory;
    } catch {
      // Fallback
    }
  }

  localMemories.push(newMemory);
  return newMemory;
}

export async function updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null> {
  const updated_at = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('memories').update({ ...updates, updated_at }).eq('id', id).select('*, category:categories(*)').single();
      if (!error && data) return data as Memory;
    } catch {
      // Fallback
    }
  }

  const idx = localMemories.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const categoryObj = updates.category_id ? localCategories.find((c) => c.id === updates.category_id) : localMemories[idx].category;
  localMemories[idx] = {
    ...localMemories[idx],
    ...updates,
    updated_at,
    category: categoryObj || localMemories[idx].category,
  };
  return localMemories[idx];
}

export async function deleteMemory(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('memories').delete().eq('id', id);
      if (!error) return true;
    } catch {
      // Fallback
    }
  }

  localMemories = localMemories.filter((m) => m.id !== id);
  return true;
}

export async function reorderMemories(orderedIds: string[]): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const updates = orderedIds.map((id, index) =>
        supabase.from('memories').update({ display_order: index + 1 }).eq('id', id)
      );
      await Promise.all(updates);
    } catch {
      // Fallback
    }
  }

  orderedIds.forEach((id, index) => {
    const mem = localMemories.find((m) => m.id === id);
    if (mem) {
      mem.display_order = index + 1;
    }
  });

  return true;
}
