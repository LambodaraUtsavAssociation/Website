'use client';

import Link from 'next/link';
import { Category, Memory } from '@/types';
import GalleryCard from './GalleryCard';
import RatLoader from './RatLoader';

interface CelebrationChaptersSectionProps {
  categories: Category[];
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
  isLoading?: boolean;
}

export default function CelebrationChaptersSection({
  memories,
  onSelectMemory,
  isLoading = false,
}: CelebrationChaptersSectionProps) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Chapter Title */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold mb-3 block">
          గ్రామ మహోత్సవ విశేషాలు &bull; Sacred Festival Chapters
        </span>
        <h2 className="font-editorial text-3xl sm:text-5xl text-ivory-50 font-normal mb-4">
          Chapters of Devotion & Tradition
        </h2>
        <p className="text-sm sm:text-base text-ivory-300/80 leading-relaxed font-sans max-w-2xl mx-auto">
          Follow our village&rsquo;s sacred journey from early mandap flower preparations and clay
          idol consecration to daily Veda parayanam, evening Anna Prasadam distribution, and the
          grand lake immersion.
        </p>
      </div>

      {/* Gallery Cards Grid or Loader */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <RatLoader message="మూషిక వాహన &bull; Loading Moments..." />
        </div>
      ) : memories.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-0.5 sm:gap-2">
          {memories.map((mem, index) => (
            <GalleryCard
              key={mem.id}
              memory={mem}
              index={index}
              priority={index < 8}
              variant="reels"
              onSelect={onSelectMemory}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-charcoal-800 max-w-md mx-auto bg-charcoal-900/50 rounded-2xl">
          <p className="text-sm text-ivory-300 font-semibold mb-1">
            No moments uploaded for this section yet.
          </p>
          <p className="text-xs text-ivory-400 font-sans">
            Photos and videos uploaded by our village administrator will appear here live.
          </p>
        </div>
      )}

      {/* Link to Historical Timeline Page */}
      <div className="mt-16 text-center">
        <Link
          href="/archive"
          className="inline-block px-8 py-3.5 border-b-2 border-gold-400/60 text-gold-300 hover:text-gold-200 hover:border-gold-400 text-xs uppercase tracking-[0.2em] font-semibold transition-all"
        >
          Explore Historical Timeline
        </Link>
      </div>
    </section>
  );
}
