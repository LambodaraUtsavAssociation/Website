export type MediaType = 'image' | 'video';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  display_order: number;
  created_at: string;
}

export interface FestivalYear {
  id: string;
  year: number;
  title: string;
  slug: string;
  description?: string | null;
  cover_image_url?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  memory_count?: number;
  photo_count?: number;
  video_count?: number;
}

export interface Memory {
  id: string;
  festival_year_id: string;
  category_id?: string | null;
  media_type: MediaType;
  title: string;
  description?: string | null;
  capture_date?: string | null;
  storage_path: string;
  thumbnail_path?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null; // Seconds for video
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  festival_year?: FestivalYear | null;
}

export interface AdminOverviewStats {
  totalYears: number;
  totalMemories: number;
  totalPhotos: number;
  totalVideos: number;
  currentYearMemories: number;
}

export interface MemoryFormData {
  festival_year_id: string;
  category_id?: string;
  media_type: MediaType;
  title: string;
  description?: string;
  capture_date?: string;
  storage_path: string;
  thumbnail_path?: string;
  is_featured: boolean;
  is_published: boolean;
  display_order?: number;
}
