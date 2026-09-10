'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Camera,
  Film,
  Sparkles,
  MapPin,
  ArrowRight,
  History,
  Flame,
  Search,
  BookOpen,
  ArrowUpDown,
} from 'lucide-react';
import { FestivalYear, Memory } from '@/types';
import { getFestivalYears, getMemories, getHeroBucketMedia } from '@/lib/data/repository';
import { filterGalleryMemories } from '@/lib/mediaUtils';
import RatLoader from '@/components/RatLoader';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';

export default function ArchivePage() {
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<'newest' | 'oldest'>('newest');

  const associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association';
  const villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli';
  const currentYear = new Date().getFullYear();

  const sortOptions: DropdownOption[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [yearsData, memoriesData, heroMedia] = await Promise.all([
          getFestivalYears(true),
          getMemories({ onlyPublished: true }),
          getHeroBucketMedia(),
        ]);

        if (isMounted) {
          setYears(yearsData);
          // Strictly count only actual gallery/celebration memories, excluding hero section images
          const galleryMemories = filterGalleryMemories(memoriesData, heroMedia);
          setMemories(galleryMemories);
        }
      } catch (err) {
        console.error('Failed to load archive data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live memory breakdown per festival year
  const enrichedYears = useMemo(() => {
    const publishedYears = years.filter((y) => y.is_published);

    return publishedYears.map((y) => {
      const yearMemories = memories.filter((m) => m.festival_year_id === y.id);
      const photoCount = yearMemories.filter((m) => m.media_type === 'image').length;
      const videoCount = yearMemories.filter((m) => m.media_type === 'video').length;
      const totalCount = yearMemories.length;

      return {
        ...y,
        memory_count: totalCount || y.memory_count || 0,
        photo_count: photoCount || y.photo_count || 0,
        video_count: videoCount || y.video_count || 0,
      };
    });
  }, [years, memories]);

  // Aggregate statistics across all editions
  const totalStats = useMemo(() => {
    const totalEditions = enrichedYears.length;
    const totalMoments = enrichedYears.reduce((sum, y) => sum + (y.memory_count || 0), 0);
    const totalPhotos = enrichedYears.reduce((sum, y) => sum + (y.photo_count || 0), 0);
    const totalVideos = enrichedYears.reduce((sum, y) => sum + (y.video_count || 0), 0);

    return { totalEditions, totalMoments, totalPhotos, totalVideos };
  }, [enrichedYears]);

  // Filter and sort years
  const filteredYears = useMemo(() => {
    return [...enrichedYears]
      .filter((y) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          y.year.toString().includes(q) ||
          y.title.toLowerCase().includes(q) ||
          (y.description && y.description.toLowerCase().includes(q)) ||
          (y.telugu_title && y.telugu_title.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (selectedSort === 'newest' ? b.year - a.year : a.year - b.year));
  }, [enrichedYears, searchQuery, selectedSort]);

  // Featured Year: the most recent or current active year
  const featuredYear = enrichedYears.length > 0 ? enrichedYears[0] : null;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Subtle Background Aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[380px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-saffron-600/15 via-gold-500/5 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* ========================================================================= */}
        {/* 1. Header: Sleek, Focused & Concise */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="relative inline-flex items-center gap-2 py-1 px-5 border-y border-gold-500/40 bg-charcoal-950/80 backdrop-blur-md mb-3 shadow-glow-gold">
            <Flame className="w-3 h-3 text-saffron-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-300">
              Sacred Chronicle &bull; {villageName}
            </span>
            <Flame className="w-3 h-3 text-saffron-400 animate-pulse" />
          </div>

          <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-ivory-50 font-normal tracking-tight mb-2.5">
            Celebrations <span className="gradient-text-gold font-normal">Archive</span>
          </h1>

          <p className="text-xs sm:text-sm text-ivory-300/80 font-sans max-w-lg mx-auto">
            Preserving the annual Vinayaka Chavithi celebrations, grand pandals, and sacred memories
            of {villageName}.
          </p>

          {/* ======================================================================= */}
          {/* 2. Compact Heritage Metrics Bar */}
          {/* ======================================================================= */}
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-2xl mx-auto">
            <div className="py-2.5 px-3 rounded-lg bg-charcoal-900/80 border border-gold-500/20 backdrop-blur-sm text-center">
              <div className="flex items-center justify-center gap-1 text-gold-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                <Calendar className="w-3 h-3" />
                <span>Editions</span>
              </div>
              <div className="font-editorial text-xl sm:text-2xl text-ivory-50 font-semibold">
                {totalStats.totalEditions || 1}
              </div>
            </div>

            <div className="py-2.5 px-3 rounded-lg bg-charcoal-900/80 border border-gold-500/20 backdrop-blur-sm text-center">
              <div className="flex items-center justify-center gap-1 text-saffron-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                <Camera className="w-3 h-3" />
                <span>Photos</span>
              </div>
              <div className="font-editorial text-xl sm:text-2xl text-ivory-50 font-semibold">
                {totalStats.totalPhotos}
              </div>
            </div>

            <div className="py-2.5 px-3 rounded-lg bg-charcoal-900/80 border border-gold-500/20 backdrop-blur-sm text-center">
              <div className="flex items-center justify-center gap-1 text-gold-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                <Film className="w-3 h-3" />
                <span>Films</span>
              </div>
              <div className="font-editorial text-xl sm:text-2xl text-ivory-50 font-semibold">
                {totalStats.totalVideos}
              </div>
            </div>

            <div className="py-2.5 px-3 rounded-lg bg-charcoal-900/80 border border-gold-500/20 backdrop-blur-sm text-center">
              <div className="flex items-center justify-center gap-1 text-saffron-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                <MapPin className="w-3 h-3" />
                <span>Village</span>
              </div>
              <div className="font-editorial text-sm sm:text-base text-ivory-50 font-medium truncate mt-0.5">
                {villageName}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Main Content: Featured Hero Banner or Empty State */}
        {/* ========================================================================= */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <RatLoader
              message="Loading Past Years Timeline..."
              submessage={`${associationName} • ${villageName}`}
            />
          </div>
        ) : enrichedYears.length === 0 ? (
          <div className="relative rounded-2xl border border-gold-500/30 p-8 text-center max-w-lg mx-auto bg-charcoal-900/70">
            <div className="inline-block py-1 px-4 border border-saffron-500/30 text-saffron-300 text-xs uppercase tracking-widest mb-4">
              Inaugural Edition
            </div>
            <h3 className="font-editorial text-2xl text-ivory-50 mb-2">
              No Past Editions Recorded Yet
            </h3>
            <p className="text-xs text-ivory-400 mb-6">
              {currentYear} marks the inaugural launch of our digital memory gallery.
            </p>
            <Link
              href="/2026"
              className="inline-block px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-ivory-50 bg-saffron-600 hover:bg-saffron-500 transition-colors"
            >
              Explore 2026 Gallery
            </Link>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-14">
            {/* ======================================================================= */}
            {/* FEATURED EDITION: Clean Cinematic Showcase Card */}
            {/* ======================================================================= */}
            {featuredYear && (
              <div className="relative rounded-2xl overflow-hidden border border-gold-500/30 bg-gradient-to-br from-charcoal-900/95 via-charcoal-950 to-charcoal-900/95 shadow-xl group">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  {/* Visual Left */}
                  <div className="lg:col-span-6 relative min-h-[220px] sm:min-h-[280px] lg:min-h-[340px] bg-charcoal-950 overflow-hidden">
                    <Image
                      src={
                        featuredYear.cover_image_url ||
                        'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=75&w=1200&auto=format&fit=crop'
                      }
                      alt={featuredYear.title}
                      fill
                      priority
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-charcoal-950/20 lg:to-charcoal-950" />

                    {/* Year & Status */}
                    <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2">
                      <div className="px-3 py-1 bg-charcoal-950/90 backdrop-blur-md border border-gold-500/50 text-gold-300 font-editorial text-base font-bold">
                        {featuredYear.year}
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-saffron-600/90 backdrop-blur-md text-ivory-50 text-[10px] font-semibold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active Chapter
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2.5 text-xs text-ivory-200 bg-charcoal-950/80 backdrop-blur-md px-3 py-1 border border-charcoal-800">
                      <span className="flex items-center gap-1 text-gold-400">
                        <Camera className="w-3 h-3" />
                        {featuredYear.photo_count} Photos
                      </span>
                      <span className="text-charcoal-600">&bull;</span>
                      <span className="flex items-center gap-1 text-saffron-400">
                        <Film className="w-3 h-3" />
                        {featuredYear.video_count} Films
                      </span>
                    </div>
                  </div>

                  {/* Content Right */}
                  <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400 block mb-1.5">
                        Featured Edition
                      </span>

                      <h2 className="font-editorial text-2xl sm:text-3xl lg:text-4xl text-ivory-50 font-normal mb-1 group-hover:text-gold-200 transition-colors">
                        {featuredYear.title}
                      </h2>

                      {featuredYear.telugu_title && (
                        <p className="text-sm text-gold-400/90 font-medium mb-3">
                          {featuredYear.telugu_title}
                        </p>
                      )}

                      <p className="text-xs sm:text-sm text-ivory-300/80 leading-relaxed font-sans mb-5 line-clamp-2">
                        {featuredYear.description ||
                          `Annual Sri Vinayaka Chavithi Mahotsavam organized by ${associationName} in ${villageName}.`}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-charcoal-800/80 border border-charcoal-700 text-xs text-ivory-200">
                          {featuredYear.memory_count} Moments
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-charcoal-800/80 border border-charcoal-700 text-xs text-ivory-200">
                          {villageName}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-charcoal-800 w-full">
                      <Link
                        href={`/${featuredYear.slug}`}
                        className="w-full flex items-center justify-center gap-2.5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ivory-50 bg-gradient-to-r from-saffron-700 via-saffron-600 to-saffron-700 border-b-2 border-gold-400 shadow-glow-saffron hover:brightness-110 active:translate-y-0.5 transition-all text-center rounded-lg"
                      >
                        <span>Enter {featuredYear.year} Gallery</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================================= */}
            {/* 4. Complete Chronicles Archive Collection */}
            {/* ======================================================================= */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-charcoal-800">
                <div>
                  <h3 className="font-editorial text-xl sm:text-2xl text-ivory-50">
                    All Editions ({filteredYears.length})
                  </h3>
                </div>

                {/* Filter & Custom Dropdown Controls */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-52 h-10">
                    <Search className="w-3.5 h-3.5 text-ivory-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search year..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 bg-charcoal-900 border border-charcoal-700 hover:border-gold-500/30 text-ivory-100 text-xs pl-9 pr-3 rounded-xl focus:outline-none focus:border-gold-500/50 transition-all placeholder:text-ivory-400/60 shadow-lg"
                    />
                  </div>

                  {/* CustomDropdown Component */}
                  <CustomDropdown
                    options={sortOptions}
                    value={selectedSort}
                    onChange={(val) => setSelectedSort(val as 'newest' | 'oldest')}
                    icon={<ArrowUpDown className="w-3.5 h-3.5 text-gold-400" />}
                    className="w-44"
                    buttonClassName="h-10 shadow-lg"
                  />
                </div>
              </div>

              {/* Responsive Card Grid */}
              {filteredYears.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredYears.map((y) => {
                    const isCurrent = y.year === currentYear;

                    return (
                      <Link
                        key={y.id}
                        href={`/${y.slug}`}
                        className="group relative flex flex-col rounded-xl overflow-hidden bg-charcoal-900/80 border border-gold-500/20 transition-all duration-300 hover:border-gold-400/60 hover:shadow-glow-gold hover:-translate-y-1"
                      >
                        {/* Card Image Banner */}
                        <div className="relative w-full h-44 bg-charcoal-950 overflow-hidden">
                          <Image
                            src={
                              y.cover_image_url ||
                              'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=70&w=700&auto=format&fit=crop'
                            }
                            alt={y.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/30 to-transparent" />

                          {/* Year Badge */}
                          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-charcoal-950/90 backdrop-blur-sm border border-gold-500/40 text-gold-300 font-editorial text-sm font-semibold shadow-md">
                            {y.year}
                          </div>

                          {isCurrent && (
                            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-saffron-600/90 text-ivory-50 text-[10px] font-semibold uppercase tracking-wider">
                              Current
                            </div>
                          )}

                          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 text-[11px] text-ivory-200 bg-charcoal-950/80 backdrop-blur-sm px-2 py-0.5 border border-charcoal-800">
                            <span className="flex items-center gap-1 text-gold-300 font-medium">
                              <Camera className="w-3 h-3" />
                              {y.photo_count}
                            </span>
                            <span className="text-charcoal-600">&bull;</span>
                            <span className="flex items-center gap-1 text-saffron-300 font-medium">
                              <Film className="w-3 h-3" />
                              {y.video_count}
                            </span>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-editorial text-lg text-ivory-50 group-hover:text-gold-300 transition-colors mb-1">
                              {y.title}
                            </h4>

                            {y.description && (
                              <p className="text-xs text-ivory-300/80 line-clamp-2 leading-relaxed mb-3">
                                {y.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2.5 border-t border-charcoal-800 flex items-center justify-between text-xs">
                            <span className="text-ivory-400 text-[11px]">
                              {y.memory_count} Moments
                            </span>
                            <span className="inline-flex items-center gap-1 text-gold-400 font-semibold uppercase tracking-wider text-[10px] group-hover:translate-x-1 transition-transform">
                              Explore
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center bg-charcoal-900/40 border border-charcoal-800 rounded-xl p-6">
                  <BookOpen className="w-7 h-7 text-gold-400/50 mx-auto mb-2" />
                  <h4 className="text-xs font-semibold text-ivory-100 mb-1">
                    No Matching Editions
                  </h4>
                  <p className="text-[11px] text-ivory-400 mb-3">
                    No records found matching &ldquo;{searchQuery}&rdquo;.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 bg-charcoal-800 text-gold-300 text-xs font-medium hover:bg-charcoal-700 transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* ======================================================================= */}
            {/* 5. Village Traditions: Concise 3 Pillars */}
            {/* ======================================================================= */}
            <div className="pt-6 border-t border-charcoal-800/80">
              <div className="text-center max-w-xl mx-auto mb-6">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-saffron-400 block mb-1">
                  Village Traditions
                </span>
                <h3 className="font-editorial text-xl sm:text-2xl text-ivory-50 font-normal">
                  The Spirit of {villageName}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pillar 1 */}
                <div className="p-4 rounded-xl bg-charcoal-900/60 border border-gold-500/20 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded bg-saffron-600/20 border border-saffron-500/40 flex items-center justify-center text-saffron-400 mb-2.5">
                    <Flame className="w-4 h-4" />
                  </div>
                  <h4 className="font-editorial text-base text-ivory-50 mb-0.5">
                    The Divine Pandal
                  </h4>
                  <div className="text-[10px] text-gold-400/90 font-medium mb-1.5">
                    గణపతి మండపం &amp; పూజలు
                  </div>
                  <p className="text-xs text-ivory-300/80 leading-relaxed font-sans">
                    Vedic consecration, morning suprabhatam, daily archana, and community prasad.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="p-4 rounded-xl bg-charcoal-900/60 border border-gold-500/20 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded bg-gold-600/20 border border-gold-500/40 flex items-center justify-center text-gold-400 mb-2.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-editorial text-base text-ivory-50 mb-0.5">
                    Cultural Evenings
                  </h4>
                  <div className="text-[10px] text-gold-400/90 font-medium mb-1.5">
                    సాంస్కృతిక వేడుకలు
                  </div>
                  <p className="text-xs text-ivory-300/80 leading-relaxed font-sans">
                    Devotional bhajans, kolatam dances, youth games, and village annadhanam.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="p-4 rounded-xl bg-charcoal-900/60 border border-gold-500/20 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded bg-saffron-600/20 border border-saffron-500/40 flex items-center justify-center text-saffron-400 mb-2.5">
                    <History className="w-4 h-4" />
                  </div>
                  <h4 className="font-editorial text-base text-ivory-50 mb-0.5">Grand Visarjan</h4>
                  <div className="text-[10px] text-gold-400/90 font-medium mb-1.5">
                    శోభాయాత్ర &amp; నిమజ్జనం
                  </div>
                  <p className="text-xs text-ivory-300/80 leading-relaxed font-sans">
                    Farewell procession with teenmaar rhythm, laddu auction, and sacred immersion.
                  </p>
                </div>
              </div>
            </div>

            {/* ======================================================================= */}
            {/* 6. Community Archive Contribution Card: Minimalist */}
            {/* ======================================================================= */}
            <div className="rounded-xl border border-gold-500/30 bg-charcoal-900/60 p-5 sm:p-6 text-center max-w-xl mx-auto">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400 block mb-1">
                Archive Preservation
              </span>
              <h4 className="font-editorial text-lg sm:text-xl text-ivory-50 mb-1.5">
                Have Memories from Past Celebrations?
              </h4>
              <p className="text-xs text-ivory-300/80 mb-3 font-sans">
                Contact the {associationName} committee to archive vintage photographs or
                recordings.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-800 text-[11px] text-gold-300 border border-gold-500/20">
                <span>{villageName}</span>
                <span>&bull;</span>
                <span>Lambodara Utsav Association</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
