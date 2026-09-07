'use client';

import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { Memory } from '@/types';
import SafeMediaImage from './SafeMediaImage';
import { getMediaDisplayInfo } from '@/lib/mediaUtils';

interface FeaturedMemoriesSectionProps {
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
}

export default function FeaturedMemoriesSection({ memories, onSelectMemory }: FeaturedMemoriesSectionProps) {
  if (!memories || memories.length === 0) return null;

  const primaryFeatured = memories[0];
  const secondaryMemories = memories.slice(1, 4);

  const primaryMedia = primaryFeatured ? getMediaDisplayInfo(primaryFeatured) : null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-charcoal-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs text-gold-400 font-semibold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Highlights</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl text-ivory-50 font-normal">
            Featured Memories of 2026
          </h2>
        </div>
        <p className="text-xs text-ivory-400 max-w-xs mt-2 sm:mt-0 leading-relaxed font-sans">
          Key moments selected by our archive curator capturing the essence of devotion and celebration.
        </p>
      </div>

      {/* Editorial Layout: 1 Dominant Card + Supporting Side Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Dominant Featured Card */}
        {primaryFeatured && primaryMedia && (
          <div
            onClick={() => onSelectMemory(primaryFeatured)}
            className="lg:col-span-7 group relative rounded-3xl overflow-hidden bg-charcoal-900 border border-charcoal-700/80 cursor-pointer min-h-[420px] lg:min-h-[550px] flex flex-col justify-end p-8 shadow-2xl transition-all duration-700 hover:border-gold-500/50 hover:shadow-glow-gold"
          >
            {/* Background Image */}
            <SafeMediaImage
              src={primaryMedia.url}
              alt={primaryFeatured.title}
              fill
              priority
              className="object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/60 via-transparent to-transparent" />

            {/* Content Overlay */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center space-x-3">
                {primaryFeatured.category && (
                  <span className="px-3 py-1 rounded-full bg-saffron-600/90 text-ivory-50 text-xs font-medium">
                    {primaryFeatured.category.name}
                  </span>
                )}
                <span className="text-xs text-ivory-300 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-gold-400" />
                  <span>{primaryFeatured.capture_date || 'August 2026'}</span>
                </span>
              </div>

              <h3 className="font-editorial text-3xl sm:text-4xl text-ivory-50 font-normal group-hover:text-gold-300 transition-colors">
                {primaryFeatured.title}
              </h3>

              {primaryFeatured.description && (
                <p className="text-sm text-ivory-300/90 max-w-xl line-clamp-3 leading-relaxed font-sans">
                  {primaryFeatured.description}
                </p>
              )}

              <div className="pt-2 flex items-center space-x-2 text-xs text-gold-400 font-medium group-hover:translate-x-1 transition-transform">
                <span>View Fullscreen Memory</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Secondary Supporting Grid */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          {secondaryMemories.map((mem) => {
            const media = getMediaDisplayInfo(mem);
            return (
              <div
                key={mem.id}
                onClick={() => onSelectMemory(mem)}
                className="group relative rounded-2xl overflow-hidden glass-panel border border-charcoal-700/60 p-4 cursor-pointer flex items-center space-x-4 transition-all duration-300 hover:border-gold-500/40 hover:-translate-y-0.5 hover:bg-charcoal-800/90"
              >
                {/* Thumbnail */}
                <div className="relative w-28 h-24 sm:w-36 sm:h-28 rounded-xl overflow-hidden bg-charcoal-900 flex-shrink-0">
                  <SafeMediaImage
                    src={media.url}
                    alt={mem.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="150px"
                  />
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                  {mem.category && (
                    <span className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold mb-1 block">
                      {mem.category.name}
                    </span>
                  )}
                  <h4 className="font-editorial text-xl text-ivory-50 group-hover:text-gold-300 transition-colors truncate">
                    {mem.title}
                  </h4>
                  {mem.description && (
                    <p className="text-xs text-ivory-400 line-clamp-2 mt-1 leading-relaxed">
                      {mem.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
