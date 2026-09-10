import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const OFFICIAL_CATEGORIES = [
  {
    name: 'Aagaman',
    slug: 'aagaman',
    description:
      'Grand arrival and welcoming processional of Lord Vinayaka into Papi Reddy Palli mandap.',
    display_order: 1,
  },
  {
    name: 'Sthapana',
    slug: 'sthapana',
    description: 'Sacred consecration, idol installation, and Prana Pratishtha rituals.',
    display_order: 2,
  },
  {
    name: 'Pooja & Aarthi',
    slug: 'pooja-aarthi',
    description:
      'Daily morning and evening Vedic rituals, brass lamp Aarti, and devotional stotram chanting.',
    display_order: 3,
  },
  {
    name: 'Decoration',
    slug: 'decoration',
    description:
      'Traditional flower garlands, coconut leaf pandal arches, and divine mandap lighting decorations.',
    display_order: 4,
  },
  {
    name: 'Culturals',
    slug: 'culturals',
    description:
      'Devotional music, traditional folk dances, drama performances, and cultural stage programs.',
    display_order: 5,
  },
  {
    name: 'Games & Competitions',
    slug: 'games-competitions',
    description:
      "Village community sports, children's drawing competitions, and festive sports events.",
    display_order: 6,
  },
  {
    name: 'Annaprasadam',
    slug: 'annaprasadam',
    description: 'Community feast distribution and sacred Mahaprasadam serving to all devotees.',
    display_order: 7,
  },
  {
    name: 'Random Clicks',
    slug: 'random-clicks',
    description:
      'Candid village moments, volunteer portraits, behind-the-scenes preparation, and festive smiles.',
    display_order: 8,
  },
  {
    name: 'Visarjan',
    slug: 'visarjan',
    description:
      'Immersion procession, grand Nimajjanam rallies, gulal celebrations, and farewell rituals.',
    display_order: 9,
  },
];

export async function POST() {
  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) {
    return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
  }

  const results: any[] = [];
  const errors: any[] = [];

  // 1. Fetch current categories in database
  const { data: existing, error: selectErr } = await adminSupabase.from('categories').select('*');
  console.log('Current DB categories count:', existing?.length, selectErr);

  const officialSlugs = OFFICIAL_CATEGORIES.map((c) => c.slug);

  // 2. Remove any old categories not in the official list
  if (existing && existing.length > 0) {
    for (const oldCat of existing) {
      if (
        !officialSlugs.includes(oldCat.slug) &&
        !OFFICIAL_CATEGORIES.some((c) => c.name === oldCat.name)
      ) {
        await adminSupabase.from('categories').delete().eq('id', oldCat.id);
      }
    }
  }

  // 3. Insert or update official 9 categories
  for (const cat of OFFICIAL_CATEGORIES) {
    const match = existing?.find(
      (e: any) => e.slug === cat.slug || e.name.toLowerCase() === cat.name.toLowerCase()
    );

    const dbPayload = {
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      display_order: cat.display_order,
      created_at: match?.created_at || new Date().toISOString(),
    };

    let opError: any = null;
    let opData: any = null;

    if (match) {
      const { data, error } = await adminSupabase
        .from('categories')
        .update(dbPayload)
        .eq('id', match.id)
        .select();
      opError = error;
      opData = data;
    } else {
      const { data, error } = await adminSupabase.from('categories').insert([dbPayload]).select();
      opError = error;
      opData = data;
    }

    if (opError) {
      console.error(`Error syncing category ${cat.name}:`, opError);
      errors.push({ name: cat.name, error: opError });
    } else {
      results.push(opData);
    }
  }

  // 4. Fetch final updated list from database
  const { data: updatedList } = await adminSupabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  return NextResponse.json({
    success: true,
    syncedCount: results.length,
    totalInDb: updatedList?.length || 0,
    errors,
    dbCategories: updatedList,
  });
}

export async function GET() {
  return POST();
}
