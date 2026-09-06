'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FestivalYear, Category, Memory } from '@/types';
import { getFestivalYearBySlug, getCategories, getMemories } from '@/lib/data/repository';
import GalleryCard from '@/components/GalleryCard';
import MemoryViewerModal from '@/components/MemoryViewerModal';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import { getDaysUntilFestival, hasFestivalStarted } from '@/lib/festivalDates';

export default function FestivalYearPage({ params }: { params: { year: string } }) {
  const [yearData, setYearData] = useState<FestivalYear | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeMediaType, setActiveMediaType] = useState<'all' | 'image' | 'video'>('all');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentCalYear = new Date().getFullYear();
  const isFestivalStarted = hasFestivalStarted(currentCalYear);
  const daysUntilStart = getDaysUntilFestival(currentCalYear);

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

  if (!isLoading && !yearData) {
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

  const coverUrl = yearData?.cover_image_url || 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=75&w=1400&auto=format&fit=crop';

  // Prepare custom dropdown options
  const chapterOptions: DropdownOption[] = [
    { value: 'all', label: 'All Chapters', count: memories.length },
    ...categories.map((cat, idx) => ({
      value: cat.slug,
      label: cat.name,
      sublabel: `0${idx + 1}.`,
      count: memories.filter((m) => m.category?.slug === cat.slug).length,
    })),
  ];

  const formatOptions: DropdownOption[] = [
    { value: 'all', label: 'All Formats' },
    { value: 'image', label: 'Photos Only' },
    { value: 'video', label: 'Films Only' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Year Banner Header */}
      <section className="relative w-full py-16 sm:py-24 bg-charcoal-900 border-b border-charcoal-800 overflow-hidden mb-12">
        <div className="absolute inset-0 z-0">
          <Image
            src={coverUrl}
            alt={yearData?.title || 'Festival Year'}
            fill
            priority
            className="object-cover opacity-20 filter blur-sm scale-105"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal-950 via-charcoal-950/80 to-charcoal-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400 block mb-2">
                Digital Gallery &bull; {params.year}
              </span>
              <h1 className="font-editorial text-4xl sm:text-6xl text-ivory-50 font-normal mb-4">
                {yearData?.title || `Vinayaka Chavithi ${params.year}`}
              </h1>
              {yearData?.description && (
                <p className="text-sm sm:text-base text-ivory-300/90 max-w-2xl leading-relaxed font-sans">
                  {yearData.description}
                </p>
              )}
            </div>

            {/* Cultural Stats Columns */}
            <div className="flex items-center space-x-6 py-3 px-6 border-l-2 border-gold-500/60 bg-charcoal-900/80 text-xs text-ivory-300 flex-shrink-0">
              <div className="text-center">
                <span className="block font-editorial text-2xl text-gold-400 font-semibold">
                  {memories.length}
                </span>
                <span className="text-[10px] text-ivory-400 uppercase tracking-widest">Total Memories</span>
              </div>
              <div className="h-8 w-px bg-charcoal-700" />
              <div className="text-center">
                <span className="block font-editorial text-2xl text-gold-400 font-semibold">
                  {memories.filter((m) => m.media_type === 'image').length}
                </span>
                <span className="text-[10px] text-ivory-400 uppercase tracking-widest">Photos</span>
              </div>
              <div className="h-8 w-px bg-charcoal-700" />
              <div className="text-center">
                <span className="block font-editorial text-2xl text-gold-400 font-semibold">
                  {memories.filter((m) => m.media_type === 'video').length}
                </span>
                <span className="text-[10px] text-ivory-400 uppercase tracking-widest">Films</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Gallery Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* CUSTOM DROPDOWN FILTERS FOR MOBILE & TABLET (<1024px) */}
        <div className="lg:hidden flex flex-col sm:flex-row gap-4 mb-10">
          <CustomDropdown
            label="Select Ritual Chapter"
            options={chapterOptions}
            value={activeCategory}
            onChange={setActiveCategory}
            className="flex-1"
          />
          <CustomDropdown
            label="Select Format"
            options={formatOptions}
            value={activeMediaType}
            onChange={(val) => setActiveMediaType(val as 'all' | 'image' | 'video')}
            className="w-full sm:w-56"
          />
        </div>

        {/* DESKTOP STEPPED HORIZONTAL FILTERS (>=1024px) */}
        <div className="hidden lg:block mb-12">
          <div className="flex items-center space-x-3 overflow-x-auto pb-4 no-scrollbar border-b border-charcoal-800">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] transition-all whitespace-nowrap border-b-2 ${
                activeCategory === 'all'
                  ? 'border-gold-400 text-gold-300 bg-saffron-600/10'
                  : 'border-transparent text-ivory-300 hover:text-ivory-50'
              }`}
            >
              All Chapters ({memories.length})
            </button>

            {categories.map((cat, idx) => {
              const count = memories.filter((m) => m.category?.slug === cat.slug).length;
              const isSelected = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] transition-all whitespace-nowrap flex items-center space-x-2 border-b-2 ${
                    isSelected
                      ? 'border-gold-400 text-gold-300 bg-saffron-600/10'
                      : 'border-transparent text-ivory-300 hover:text-ivory-50'
                  }`}
                >
                  <span className="text-gold-400/80 font-mono text-[11px]">0{idx + 1}.</span>
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Format Selector Bar */}
          <div className="flex items-center justify-between pt-4 text-xs">
            <span className="text-ivory-400 text-[11px] uppercase tracking-[0.2em] font-semibold">
              Format Filter:
            </span>
            <div className="flex items-center space-x-4 border-l-2 border-gold-500/40 pl-4">
              <button
                onClick={() => setActiveMediaType('all')}
                className={`text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors ${
                  activeMediaType === 'all' ? 'text-gold-300 border-b border-gold-400' : 'text-ivory-400 hover:text-ivory-200'
                }`}
              >
                All Formats
              </button>
              <button
                onClick={() => setActiveMediaType('image')}
                className={`text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors ${
                  activeMediaType === 'image' ? 'text-gold-300 border-b border-gold-400' : 'text-ivory-400 hover:text-ivory-200'
                }`}
              >
                Photos
              </button>
              <button
                onClick={() => setActiveMediaType('video')}
                className={`text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors ${
                  activeMediaType === 'video' ? 'text-gold-300 border-b border-gold-400' : 'text-ivory-400 hover:text-ivory-200'
                }`}
              >
                Films
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Masonry or Arched Pre-Festival Card */}
        {filteredMemories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemories.map((mem) => (
              <GalleryCard
                key={mem.id}
                memory={mem}
                onSelect={(selected) => {
                  const actualIndex = filteredMemories.findIndex((m) => m.id === selected.id);
                  setSelectedIndex(actualIndex);
                }}
              />
            ))}
          </div>
        ) : !isFestivalStarted && params.year === '2026' ? (
          /* Arched Mandap Sanctuary Frame for 2026 */
          <div className="relative rounded-t-[3.5rem] rounded-b-none border-t-2 border-x border-gold-500/40 p-8 sm:p-14 text-center max-w-3xl mx-auto shadow-2xl bg-gradient-to-b from-charcoal-900 via-charcoal-950 to-charcoal-900 overflow-hidden my-10">
            <div className="relative z-10">
              <div className="inline-block py-1 px-6 border-y border-saffron-500/40 bg-saffron-600/10 text-saffron-300 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
                Countdown to Vinayaka Chavithi ({daysUntilStart} Days)
              </div>

              <h3 className="font-editorial text-3xl sm:text-4xl text-ivory-50 font-normal mb-4 leading-tight">
                Vinayaka Chavithi 2026 Begins September 14, 2026
              </h3>

              <p className="text-sm sm:text-base text-ivory-200/80 max-w-xl mx-auto leading-relaxed mb-10 font-sans">
                Our digital gallery is live and awaiting the grand start of our 5-day celebration. Starting September 14, our village administrator will upload high-resolution photographs and cinematic video footage live from each day&rsquo;s rituals, morning garlands, evening aartis, and community meals.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto pt-8 border-t border-charcoal-800 text-xs text-ivory-300">
                <div className="p-4 border-l-2 border-gold-500/60 bg-charcoal-900/80 text-left">
                  <span className="block text-gold-400 font-semibold uppercase tracking-wider mb-1">Day 1 &bull; Sept 14</span>
                  <span className="text-ivory-100 font-medium">Grand Arrival & Sthapana</span>
                </div>
                <div className="p-4 border-l-2 border-gold-500/60 bg-charcoal-900/80 text-left">
                  <span className="block text-gold-400 font-semibold uppercase tracking-wider mb-1">Days 2-4 &bull; Sept 15-17</span>
                  <span className="text-ivory-100 font-medium">Pooja & Cultural Nights</span>
                </div>
                <div className="p-4 border-l-2 border-gold-400 bg-charcoal-900/80 text-left">
                  <span className="block text-gold-400 font-semibold uppercase tracking-wider mb-1">Day 5 &bull; Sept 18</span>
                  <span className="text-ivory-100 font-medium">Lake Visarjan & Nimajjanam</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center border border-charcoal-800 max-w-lg mx-auto bg-charcoal-900/50">
            <h3 className="font-editorial text-2xl text-ivory-200 mb-2">No Memories Found</h3>
            <p className="text-xs text-ivory-400">Our village administrator will publish moments for this selection soon.</p>
          </div>
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
