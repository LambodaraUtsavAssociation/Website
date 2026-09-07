'use client';

import { useState, useEffect } from 'react';
import { FestivalYear, Category, Memory } from '@/types';
import {
  getFestivalYears,
  getActiveFestivalYear,
  getCategories,
  getMemories,
  getFeaturedVideo,
} from '@/lib/data/repository';

import HeroSection from '@/components/HeroSection';
import FestivalIntroSection from '@/components/FestivalIntroSection';
import CelebrationChaptersSection from '@/components/CelebrationChaptersSection';
import ArchiveYearsSection from '@/components/ArchiveYearsSection';
import MemoryViewerModal from '@/components/MemoryViewerModal';

const INAUGURAL_2026_YEAR: FestivalYear = {
  id: '2026-inaugural-id',
  year: 2026,
  title: 'Vinayaka Chavithi 2026',
  slug: '2026',
  description: 'Inaugural digital gallery preserving the sacred traditions of Lambodara Utsav Association, Papi Reddy Palli.',
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function HomePage() {
  const [festivalYear, setFestivalYear] = useState<FestivalYear | null>(null);
  const [allYears, setAllYears] = useState<FestivalYear[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [featuredVideo, setFeaturedVideo] = useState<Memory | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const years = await getFestivalYears(true);
      setAllYears(years);

      const activeYear = await getActiveFestivalYear();
      if (activeYear) {
        setFestivalYear(activeYear);
      } else if (years.length > 0) {
        setFestivalYear(years[0]);
      }

      const cats = await getCategories();
      setCategories(cats);

      const memories = await getMemories({ onlyPublished: true });
      setAllMemories(memories);

      const vid = await getFeaturedVideo();
      setFeaturedVideo(vid);
      setIsLoading(false);
    }

    loadData();
  }, []);

  const handleSelectMemory = (memory: Memory) => {
    const idx = allMemories.findIndex((m) => m.id === memory.id);
    if (idx !== -1) {
      setSelectedIndex(idx);
    }
  };

  const activeYearObj = festivalYear || INAUGURAL_2026_YEAR;

  return (
    <div className="w-full">
      {/* Hero Section — Always renders immediately on initial load */}
      <HeroSection festivalYear={activeYearObj} memories={allMemories} />

      {/* Festival Introduction */}
      <FestivalIntroSection activeYear={activeYearObj} />

      {/* Celebration Chapters Timeline */}
      <CelebrationChaptersSection
        categories={categories}
        memories={allMemories}
        onSelectMemory={handleSelectMemory}
        isLoading={isLoading}
      />

      {/* Archive Years Section */}
      <ArchiveYearsSection years={allYears} />

      {/* Fullscreen Lightbox Modal */}
      <MemoryViewerModal
        memories={allMemories}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onNavigate={(newIdx) => setSelectedIndex(newIdx)}
      />
    </div>
  );
}
