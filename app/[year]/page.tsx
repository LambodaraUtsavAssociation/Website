'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter } from 'lucide-react';
import { FestivalYear, Category, Memory } from '@/types';
import { getFestivalYearBySlug, getCategories, getMemories } from '@/lib/data/repository';
import GalleryCard from '@/components/GalleryCard';
import MemoryViewerModal from '@/components/MemoryViewerModal';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import EmptyState from '@/components/EmptyState';
import RatLoader from '@/components/RatLoader';

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

  useEffect(() => {
    async function loadYearDetails() {
      setIsLoading(true);
      const yearObj = await getFestivalYearBySlug(params.year);
      if (!yearObj) {
        setIsLoading(false);
        return;
      }

      setYearData(yearObj);

      const cats = await getCategories();
      setCategories(cats);

      const mems = await getMemories({ yearId: yearObj.id, onlyPublished: true });
      setMemories(mems);
      setIsLoading(false);
    }

    loadYearDetails();
  }, [params.year]);

  // Conditional early returns placed AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-20 flex flex-col items-center justify-center">
        <RatLoader message="Loading Celebration Gallery..." submessage={`Fetching ${params.year} Festival Memories`} />
      </div>
    );
  }

  if (!yearData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-24">
        <h1 className="font-editorial text-4xl text-ivory-50 mb-3">Festival Year Not Found</h1>
        <p className="text-sm text-ivory-400 max-w-md mb-6">
          The requested year &ldquo;{params.year}&rdquo; is not yet published in our village digital gallery.
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
    { value: 'all', label: `All ${yearData.year} Memories`, count: memories.length, isGroupHeader: true },
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
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Gallery Header with Borderless Filter Icon Trigger */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-charcoal-800/80">
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

        {/* Instagram Profile Style Gallery Grid */}
        {filteredMemories.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-0.5 sm:gap-5 items-stretch w-full">
            {filteredMemories.map((memory, index) => (
              <GalleryCard
                key={memory.id}
                memory={memory}
                index={index}
                priority={index < 4}
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
