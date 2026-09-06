import { Category, FestivalYear, Memory } from '@/types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Preparation',
    slug: 'preparation',
    description: 'Handcrafting mandap decor, flower garlands, and traditional lighting setup',
    display_order: 1,
    created_at: new Date('2026-08-20').toISOString(),
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Vinayaka Arrival',
    slug: 'Vinayaka-arrival',
    description: 'Grand procession and welcoming of Lord Vinayakaa into the village',
    display_order: 2,
    created_at: new Date('2026-08-21').toISOString(),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    name: 'Pooja & Aarti',
    slug: 'pooja-aarti',
    description: 'Sacred rituals, Vedic chants, evening lamps, and community prayers',
    display_order: 3,
    created_at: new Date('2026-08-22').toISOString(),
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    name: 'Celebration',
    slug: 'celebration',
    description: 'Devotional music, folk dances, prasadam distribution, and joyous gatherings',
    display_order: 4,
    created_at: new Date('2026-08-23').toISOString(),
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    name: 'Cultural Events',
    slug: 'cultural-events',
    description: 'Traditional arts, children performances, and evening musical renditions',
    display_order: 5,
    created_at: new Date('2026-08-24').toISOString(),
  },
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    name: 'Community Moments',
    slug: 'community-moments',
    description: 'Shared meals, village elders, youth volunteers, and togetherness',
    display_order: 6,
    created_at: new Date('2026-08-25').toISOString(),
  },
  {
    id: 'c7777777-7777-7777-7777-777777777777',
    name: 'Visarjan',
    slug: 'visarjan',
    description: 'Emotional farewell procession and immersion with prayers for next year',
    display_order: 7,
    created_at: new Date('2026-08-26').toISOString(),
  },
];

export const INITIAL_YEARS: FestivalYear[] = [
  {
    id: 'f2026000-0000-0000-0000-000000002026',
    year: 2026,
    title: 'Vinayaka Chavithi 2026',
    slug: '2026',
    description: 'The inaugural year of Lambodara Utsav Association (Papi Reddy Palli) digital memory gallery, preserving every sacred ritual, vibrant procession, and shared smile of the 2026 Vinayaka Chavithi celebrations starting September 14, 2026.',
    cover_image_url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=2000&auto=format&fit=crop',
    is_published: true,
    created_at: new Date('2026-08-01').toISOString(),
    updated_at: new Date('2026-08-01').toISOString(),
    memory_count: 0,
    photo_count: 0,
    video_count: 0,
  },
];

// Pre-festival: INITIAL_MEMORIES is empty until festival starts on September 14, 2026!
export const INITIAL_MEMORIES: Memory[] = [];
