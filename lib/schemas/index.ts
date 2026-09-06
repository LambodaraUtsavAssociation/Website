import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid administrator email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const festivalYearSchema = z.object({
  year: z.number().int().min(1950, 'Year must be after 1950').max(2100, 'Invalid year'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional().nullable(),
  cover_image_url: z.string().optional().nullable(),
  is_published: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  slug: z.string().min(2, 'Category slug is required'),
  description: z.string().optional().nullable(),
  display_order: z.number().int().default(0),
});

export const memorySchema = z.object({
  festival_year_id: z.string().uuid('Valid festival year ID required').or(z.string().min(1, 'Festival year required')),
  category_id: z.string().optional().nullable(),
  media_type: z.enum(['image', 'video']),
  title: z.string().min(2, 'Memory title is required'),
  description: z.string().optional().nullable(),
  capture_date: z.string().optional().nullable(),
  storage_path: z.string().min(1, 'Media file or URL is required'),
  thumbnail_path: z.string().optional().nullable(),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  display_order: z.number().int().default(0),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type FestivalYearInput = z.infer<typeof festivalYearSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type MemoryInput = z.infer<typeof memorySchema>;
