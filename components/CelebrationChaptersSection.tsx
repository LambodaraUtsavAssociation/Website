'use client';

import Link from 'next/link';
import { Category, Memory } from '@/types';
import GalleryCard from './GalleryCard';
import { getDaysUntilFestival, hasFestivalStarted } from '@/lib/festivalDates';

interface CelebrationChaptersSectionProps {
  categories: Category[];
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
}

export default function CelebrationChaptersSection({
  memories,
  onSelectMemory,
}: CelebrationChaptersSectionProps) {
  const currentCalYear = new Date().getFullYear();
  const isFestivalStarted = hasFestivalStarted(currentCalYear);
  const daysUntilStart = getDaysUntilFestival(currentCalYear);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Chapter Title */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold mb-3 block">
          &#3118;&#3125;&#3134; &#3093;&#3134;&#3117;&#3134;&#3110;&#3135;&#3093;&#3134;&#3117;&#3135;&#3114;&#3137; &bull; 5-Day Sacred Festival Journey
        </span>
        <h2 className="font-editorial text-3xl sm:text-5xl text-ivory-50 font-normal mb-4">
          Chapters of Devotion & Tradition
        </h2>
        <p className="text-sm sm:text-base text-ivory-300/80 leading-relaxed font-sans max-w-2xl mx-auto">
          Follow our village&rsquo;s sacred journey — from early mandap flower preparations and clay idol consecration to daily Veda parayanam, evening prasadam distribution, and the grand lake immersion.
        </p>
      </div>

      {/* Gallery Cards Grid or Arched Mandap Portal Sanctuary Card */}
      {memories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((mem) => (
            <GalleryCard key={mem.id} memory={mem} onSelect={onSelectMemory} />
          ))}
        </div>
      ) : !isFestivalStarted ? (
        /* Arched Mandap Sanctuary Frame for 5-Day Celebration */
        <div className="relative rounded-t-[3.5rem] rounded-b-none border-t-2 border-x border-gold-500/40 p-8 sm:p-14 text-center max-w-4xl mx-auto shadow-2xl bg-gradient-to-b from-charcoal-900 via-charcoal-950 to-charcoal-900 overflow-hidden">
          {/* Ambient Lighting Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-saffron-600/15 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-gold-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* Traditional Geometric Corner Motifs */}
          <div className="absolute top-6 left-6 text-gold-400/60 font-serif text-sm">◇</div>
          <div className="absolute top-6 right-6 text-gold-400/60 font-serif text-sm">◇</div>

          <div className="relative z-10">
            {/* Arched Status Header */}
            <div className="inline-block py-1 px-6 border-y border-saffron-500/40 bg-saffron-600/10 text-saffron-300 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
              Countdown to Vinayaka Chavithi ({daysUntilStart} Days)
            </div>

            <h3 className="font-editorial text-3xl sm:text-4xl text-ivory-50 font-normal mb-4 leading-tight">
              Vinayaka Chavithi 2026 Begins September 14, 2026
            </h3>

            <p className="text-sm sm:text-base text-ivory-200/80 max-w-2xl mx-auto leading-relaxed mb-10 font-sans">
              Our digital gallery is live and awaiting the grand start of our 5-day festival. Starting September 14, high-resolution photographs and video moments will be updated live from morning aartis, floral garlands, evening bhajans, and community feasts.
            </p>

            {/* Stepped Temple Columns for 5-Day Schedule with Deep Devotional Context */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-8 border-t border-charcoal-800 text-xs text-ivory-300 text-left">
              <div className="p-5 border-l-2 border-gold-500/60 bg-charcoal-900/80">
                <span className="block text-gold-400 font-semibold uppercase tracking-wider mb-1">Day 1 &bull; Sept 14</span>
                <h4 className="text-ivory-50 font-editorial text-lg font-normal mb-1.5">Sthapana & Avahanam</h4>
                <p className="text-[11px] text-ivory-400 leading-relaxed font-sans">
                  Welcoming the Lord into the village mandap, Prana Pratishtha ritual, morning Ashtottara pooja, and modakam offerings.
                </p>
              </div>

              <div className="p-5 border-l-2 border-gold-500/60 bg-charcoal-900/80">
                <span className="block text-gold-400 font-semibold uppercase tracking-wider mb-1">Days 2-4 &bull; Sept 15-17</span>
                <h4 className="text-ivory-50 font-editorial text-lg font-normal mb-1.5">Pooja & Community Bhajans</h4>
                <p className="text-[11px] text-ivory-400 leading-relaxed font-sans">
                  Sahasranama Archana, evening 108 oil lamp Aarti, daily prasadam distribution, and traditional Kolatam folk dance nights.
                </p>
              </div>

              <div className="p-5 border-l-2 border-gold-400 bg-charcoal-900/80">
                <span className="block text-gold-400 font-semibold uppercase tracking-wider mb-1">Day 5 &bull; Sept 18</span>
                <h4 className="text-ivory-50 font-editorial text-lg font-normal mb-1.5">Shobha Yatra & Nimajjanam</h4>
                <p className="text-[11px] text-ivory-400 leading-relaxed font-sans">
                  Emotional farewell procession through village streets with dhol-tasha drums, gulal colors, and solemn lake immersion.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border border-charcoal-800 max-w-md mx-auto bg-charcoal-900/50">
          <p className="text-sm text-ivory-400 mb-2">No memories uploaded for this chapter yet.</p>
          <p className="text-xs text-ivory-500">Our village administrator will upload photos and videos soon.</p>
        </div>
      )}

      {/* Link to Historical Timeline Page */}
      <div className="mt-16 text-center">
        <Link
          href="/archive"
          className="inline-block px-8 py-3.5 border-b-2 border-gold-400/60 text-gold-300 hover:text-gold-200 hover:border-gold-400 text-xs uppercase tracking-[0.2em] font-semibold transition-all"
        >
          Explore Historical Timeline &rarr;
        </Link>
      </div>
    </section>
  );
}
