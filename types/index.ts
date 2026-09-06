export type MediaType = 'image' | 'video';

export interface Category {
  id: string;
  name: string;
  telugu_name?: string | null;
  slug: string;
  description?: string | null;
  telugu_description?: string | null;
  display_order: number;
  metadata?: Record<string, any>;
  deleted_at?: string | null;
  created_at: string;
}

export interface FestivalYear {
  id: string;
  year: number;
  title: string;
  telugu_title?: string | null;
  slug: string;
  description?: string | null;
  telugu_description?: string | null;
  cover_image_url?: string | null;
  is_published: boolean;
  metadata?: Record<string, any>;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  memory_count?: number;
  photo_count?: number;
  video_count?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Memory {
  id: string;
  festival_year_id: string;
  category_id?: string | null;
  media_type: MediaType;
  title: string;
  telugu_title?: string | null;
  description?: string | null;
  telugu_description?: string | null;
  capture_date?: string | null;
  storage_path: string;
  thumbnail_path?: string | null;
  card_path?: string | null;
  full_path?: string | null;
  hls_manifest_path?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null; // Seconds for video
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  metadata?: Record<string, any>;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  festival_year?: FestivalYear | null;
  tags?: Tag[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, any>;
  created_at: string;
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
  telugu_title?: string;
  description?: string;
  telugu_description?: string;
  capture_date?: string;
  storage_path: string;
  thumbnail_path?: string;
  card_path?: string;
  full_path?: string;
  is_featured: boolean;
  is_published: boolean;
  display_order?: number;
  metadata?: Record<string, any>;
}
