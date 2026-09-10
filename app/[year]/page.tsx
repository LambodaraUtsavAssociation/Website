'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, WifiOff, RefreshCw } from 'lucide-react';
import { FestivalYear, Category, Memory } from '@/types';
import {
  getFestivalYearBySlug,
  getCategories,
  getMemories,
  getHeroBucketMedia,
} from '@/lib/data/repository';
import { filterGalleryMemories } from '@/lib/mediaUtils';
import GalleryCard from '@/components/GalleryCard';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import EmptyState from '@/components/EmptyState';
import RatLoader from '@/components/RatLoader';
import MemoryViewerModal from '@/components/MemoryViewerModal';

export default function FestivalYearPage({ params }: { params: { year: string } }) {
  // All Hooks MUST be declared at top-level before any conditional returns
  const [yearData, setYearData] = useState<FestivalYear | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeMediaType, setActiveMediaType] = useState<'all' | 'image' | 'video'>('all');
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadYearDetails = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const yearObj = await getFestivalYearBySlug(params.year);

      if (!yearObj) {
        setIsLoading(false);
        return;
      }

      setYearData(yearObj);

      const [cats, mems, heroBucketMedia] = await Promise.all([
        getCategories(),
        getMemories({ yearId: yearObj.id, onlyPublished: true }),
        getHeroBucketMedia().catch(() => []),
      ]);

      setCategories(cats);

      // Filter out hero section featured memories so that counts and gallery items strictly match
      const galleryMemories = filterGalleryMemories(mems, heroBucketMedia);
      setMemories(galleryMemories);
    } catch (err: any) {
      console.error('Failed to load year memories:', err);
      setFetchError(err?.message || 'Network connection failed while fetching memories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadYearDetails();
  }, [params.year]);

  if (!isLoading && fetchError) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-24">
        <div className="w-14 h-14 rounded-2xl bg-charcoal-850 border border-gold-500/30 flex items-center justify-center text-gold-400 mb-4 shadow-inner">
          <WifiOff className="w-7 h-7 text-gold-400/90" />
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl text-ivory-50 mb-3">Connection Interrupted</h1>
        <p className="text-sm text-ivory-400 max-w-md mb-6 leading-relaxed">
          Could not load festival memories for {yearData?.year || params.year}. Please check your internet connection.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadYearDetails()}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-saffron-600 hover:bg-saffron-500 border-b-2 border-gold-400 text-ivory-50 text-xs font-semibold uppercase tracking-[0.2em] transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-charcoal-800 hover:bg-charcoal-700 text-ivory-200 text-xs font-semibold uppercase tracking-[0.15em] border border-charcoal-700 transition-all"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isLoading && !yearData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-24">
        <h1 className="font-editorial text-4xl text-ivory-50 mb-3">Festival Year Not Found</h1>
        <p className="text-sm text-ivory-400 max-w-md mb-6">
          The requested year &ldquo;{params.year}&rdquo; is not yet published in our village digital
          gallery.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-saffron-600 border-b-2 border-gold-400 text-ivory-50 text-xs font-semibold uppercase tracking-[0.2em]"
        >
          Return to Homepage
        </Link>
      </div>
    );
  }

  const filteredMemories = memories.filter((m) => {
    const matchesCat = activeCategory === 'all' || m.category?.slug === activeCategory;
    const matchesMedia = activeMediaType === 'all' || m.media_type === activeMediaType;
    return matchesCat && matchesMedia;
  });

  const singleFilterOptions: DropdownOption[] = [
    {
      value: 'all',
      label: `All ${yearData?.year || params.year} Memories`,
      count: memories.length,
      isGroupHeader: true,
    },
  ];

  categories.forEach((cat) => {
    const catCount = memories.filter((m) => m.category?.slug === cat.slug).length;
    singleFilterOptions.push({
      value: `cat:${cat.slug}`,
      label: `└ ${cat.name}`,
      count: catCount,
      indent: true,
    });
  });

  singleFilterOptions.push(
    {
      value: 'fmt:image',
      label: '└ Photos Only',
      count: memories.filter((m) => m.media_type === 'image').length,
      indent: true,
    },
    {
      value: 'fmt:video',
      label: '└ Films Only',
      count: memories.filter((m) => m.media_type === 'video').length,
      indent: true,
    }
  );

  const handleFilterChange = (val: string) => {
    setSelectedFilterValue(val);
    if (val === 'all') {
      setActiveCategory('all');
      setActiveMediaType('all');
    } else if (val.startsWith('cat:')) {
      setActiveCategory(val.replace('cat:', ''));
      setActiveMediaType('all');
    } else if (val.startsWith('fmt:')) {
      setActiveCategory('all');
      setActiveMediaType(val.replace('fmt:', '') as 'all' | 'image' | 'video');
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20">
      {/* Main Gallery Area */}
      <div className="relative z-30 max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
        {/* Compact Gallery Header with Borderless Filter Icon Trigger */}
        <div className="flex items-center justify-between mb-6 pb-4 px-2 sm:px-0 border-b border-charcoal-800/80">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
            Digital Gallery Archive &bull; {params.year}
          </span>

          <CustomDropdown
            icon={<Filter className="w-5 h-5 text-gold-400" />}
            variant="iconOnly"
            options={singleFilterOptions}
            value={selectedFilterValue}
            onChange={handleFilterChange}
          />
        </div>

        {/* Instagram / Reels Style Media Grid (4-col Web, 3-col Mobile, tight gap, zero video icons) */}
        {isLoading ? (
          <div className="py-24 flex items-center justify-center">
            <RatLoader message={`Loading ${params.year} Memories...`} />
          </div>
        ) : filteredMemories.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2 items-stretch w-full">
            {filteredMemories.map((memory, index) => (
              <GalleryCard
                key={memory.id}
                memory={memory}
                index={index}
                priority={index < 8}
                variant="reels"
                onSelect={(selected) => {
                  const actualIndex = filteredMemories.findIndex((m) => m.id === selected.id);
                  setSelectedIndex(actualIndex);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Moments Found for Selection"
            description="No published photos or films match your active chapter or format filter. Try resetting filters to explore all memories."
            actionText="Reset Filter Selection"
            onAction={() => {
              setActiveCategory('all');
              setActiveMediaType('all');
            }}
            badge="Digital Gallery Search"
          />
        )}
      </div>

      {/* Fullscreen Lightbox Viewer */}
      <MemoryViewerModal
        memories={filteredMemories}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onNavigate={(newIdx) => setSelectedIndex(newIdx)}
      />
    </div>
  );
}
