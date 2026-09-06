'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Memory } from '@/types';

interface GalleryCardProps {
  memory: Memory;
  onSelect: (memory: Memory) => void;
  priority?: boolean;
}

export default function GalleryCard({ memory, onSelect, priority = false }: GalleryCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const imageUrl = memory.thumbnail_path || memory.storage_path;
  const isVideo = memory.media_type === 'video';

  return (
    <div
      onClick={() => onSelect(memory)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-charcoal-850 border border-charcoal-700/60 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-glow-gold hover:shadow-2xl"
    >
      {/* Media Image / Video Poster Container */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[3/2] overflow-hidden bg-charcoal-900">
        <Image
          src={imageUrl}
          alt={memory.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover object-center transition-all duration-500 group-hover:scale-105 ${
            isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-90 blur-sm scale-105'
          }`}
          onLoad={() => setIsLoaded(true)}
        />

        {/* Video Badge Overlay */}
        {isVideo && (
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-charcoal-950/85 backdrop-blur-md border border-gold-500/40 text-gold-400 font-semibold text-[10px] tracking-widest uppercase">
            FILM
          </div>
        )}

        {/* Category Pill */}
        {memory.category && (
          <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-charcoal-950/75 backdrop-blur-md border border-ivory-50/10 text-ivory-200 text-xs font-sans">
            {memory.category.name}
          </div>
        )}

        {/* Featured Badge */}
        {memory.is_featured && (
          <div className="absolute bottom-3 left-3 z-10 px-2.5 py-0.5 rounded-md bg-saffron-600/90 text-ivory-50 text-[10px] uppercase tracking-wider font-semibold">
            FEATURED
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
      </div>

      {/* Card Information */}
      <div className="p-4 sm:p-5 flex flex-col justify-between relative z-10">
        <div>
          <h4 className="font-editorial text-xl font-normal text-ivory-50 group-hover:text-gold-300 transition-colors line-clamp-1 mb-1">
            {memory.title}
          </h4>

          {memory.description && (
            <p className="text-xs text-ivory-300/80 line-clamp-2 leading-relaxed mb-3">
              {memory.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-charcoal-800 text-[11px] text-ivory-400">
          <span>{memory.capture_date || 'August 2025'}</span>

          <div className="text-[10px] uppercase tracking-widest text-gold-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            VIEW MEMORY
          </div>
        </div>
      </div>
    </div>
  );
}
