'use client';

import { useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { FestivalYear, Category, Memory } from '@/types';
import {
  getFestivalYears,
  getCategories,
  getMemories,
  getHeroBucketMedia,
} from '@/lib/data/repository';
import { filterGalleryMemories } from '@/lib/mediaUtils';


import HeroSection, { HeroMediaItem } from '@/components/HeroSection';
import FestivalIntroSection from '@/components/FestivalIntroSection';
import CelebrationChaptersSection from '@/components/CelebrationChaptersSection';
import ArchiveYearsSection from '@/components/ArchiveYearsSection';
import MemoryViewerModal from '@/components/MemoryViewerModal';

const INAUGURAL_2026_YEAR: FestivalYear = {
  id: '2026-inaugural-id',
  year: 2026,
  title: 'Vinayaka Chavithi 2026',
  slug: '2026',
  description:
    'Inaugural digital gallery preserving the sacred traditions of Lambodara Utsav Association, Papi Reddy Palli.',
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface HomePageClientProps {
  initialYears: FestivalYear[];
  initialCategories: Category[];
  initialMemories: Memory[];
  initialHeroMedia: HeroMediaItem[];
}

export default function HomePageClient({
  initialYears = [],
  initialCategories = [],
  initialMemories = [],
  initialHeroMedia = [],
}: HomePageClientProps) {
  const [allYears, setAllYears] = useState<FestivalYear[]>(initialYears);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [allMemories, setAllMemories] = useState<Memory[]>(initialMemories);
  const [heroBucketMedia, setHeroBucketMedia] = useState<HeroMediaItem[]>(initialHeroMedia);
  const [festivalYear, setFestivalYear] = useState<FestivalYear | null>(() => {
    return (
      initialYears.find((y) => y.slug === '2026' || y.year === 2026) ||
      initialYears[0] ||
      INAUGURAL_2026_YEAR
    );
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const reloadData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [years, cats, memories, heroMedia] = await Promise.all([
        getFestivalYears(true),
        getCategories(),
        getMemories({ onlyPublished: true }),
        getHeroBucketMedia().catch(() => []),
      ]);

      setAllYears(years);
      setCategories(cats);
      setAllMemories(memories);
      setHeroBucketMedia(heroMedia || []);

      const activeYear =
        years.find((y) => y.slug === '2026' || y.year === 2026) || years[0] || INAUGURAL_2026_YEAR;
      setFestivalYear(activeYear);
    } catch (err: any) {
      console.error('Failed to reload live memories:', err);
      setFetchError(err?.message || 'Connection interrupted while refreshing memories.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out memories featured in the Hero section so that only actual gallery/celebration items are counted and displayed
  const galleryMemories = filterGalleryMemories(allMemories, heroBucketMedia);

  // Compute live gallery memory counts per year for Archive timeline, strictly excluding hero media
  const enrichedYears = allYears.map((y) => {
    const yearGalleryCount = galleryMemories.filter((m) => m.festival_year_id === y.id).length;
    return {
      ...y,
      memory_count: yearGalleryCount,
    };
  });

  const handleSelectMemory = (memory: Memory) => {
    const idx = galleryMemories.findIndex((m) => m.id === memory.id);
    if (idx !== -1) {
      setSelectedIndex(idx);
    }
  };

  const activeYearObj = festivalYear || INAUGURAL_2026_YEAR;

  return (
    <div className="w-full">
      {/* Network / Offline Reconnect Banner */}
      {fetchError && (
        <div className="bg-gradient-to-r from-amber-950 via-charcoal-900 to-amber-950 border-b border-gold-500/40 px-4 py-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3 sticky top-16 z-40 shadow-lg">
          <div className="flex items-center space-x-2 text-gold-400 text-xs font-semibold">
            <WifiOff className="w-4 h-4 text-gold-400" />
            <span>Connection Interrupted: Could not synchronize latest live festival memories.</span>
          </div>
          <button
            onClick={reloadData}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1 bg-saffron-600 hover:bg-saffron-500 text-ivory-50 text-[11px] font-bold uppercase tracking-wider border-b border-gold-300 shadow transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Hero Section — Uses allMemories to pick featured hero media */}
      <HeroSection
        festivalYear={activeYearObj}
        memories={allMemories}
        initialHeroMedia={heroBucketMedia}
      />

      {/* Festival Introduction */}
      <FestivalIntroSection activeYear={activeYearObj} />

      {/* Celebration Chapters Timeline — Excludes Hero featured images */}
      <CelebrationChaptersSection
        categories={categories}
        memories={galleryMemories}
        onSelectMemory={handleSelectMemory}
        isLoading={isLoading}
      />

      {/* Archive Years Section */}
      <ArchiveYearsSection years={enrichedYears} />

      {/* Fullscreen Lightbox Modal */}
      <MemoryViewerModal
        memories={galleryMemories}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onNavigate={(newIdx) => setSelectedIndex(newIdx)}
      />
    </div>
  );
}
