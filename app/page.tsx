import {
  getFestivalYears,
  getCategories,
  getMemories,
  getHeroBucketMedia,
} from '@/lib/data/repository';
import HomePageClient from '@/components/HomePageClient';

// Enable Incremental Static Regeneration with 60s cache revalidation for instant initial load
export const revalidate = 60;

export default async function HomePage() {
  const [years, categories, memories, heroMedia] = await Promise.all([
    getFestivalYears(true),
    getCategories(),
    getMemories({ onlyPublished: true }),
    getHeroBucketMedia().catch(() => []),
  ]);

  return (
    <HomePageClient
      initialYears={years}
      initialCategories={categories}
      initialMemories={memories}
      initialHeroMedia={heroMedia}
    />
  );
}
