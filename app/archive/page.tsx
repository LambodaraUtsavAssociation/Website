'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FestivalYear } from '@/types';
import { getFestivalYears } from '@/lib/data/repository';
import RatLoader from '@/components/RatLoader';

export default function ArchivePage() {
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association';
  const villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli';
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function loadYears() {
      setIsLoading(true);
      const data = await getFestivalYears(true);
      setYears(data);
      setIsLoading(false);
    }
    loadYears();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-20 flex flex-col items-center justify-center">
        <RatLoader message="Loading Past Years Timeline..." submessage={`${associationName} • ${villageName}`} />
      </div>
    );
  }

  const pastYears = years.filter((y) => y.year < currentYear && y.is_published);

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header with Temple Gateway Motif */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="relative inline-block py-2 px-8 border-y-2 border-gold-500/40 bg-charcoal-950/60 backdrop-blur-md mb-6">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold-400 rotate-45 border border-charcoal-950" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-300">
            Visual History &bull; {associationName} ({villageName})
          </span>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold-400 rotate-45 border border-charcoal-950" />
        </div>

        <h1 className="font-editorial text-4xl sm:text-6xl text-ivory-50 font-normal mb-4">
          Past Celebrations Timeline
        </h1>
        <p className="text-sm sm:text-base text-ivory-300/80 leading-relaxed font-sans">
          A living digital collection capturing every past year of {associationName}&rsquo;s Vinayaka Chavithi celebrations in {villageName}. Past years are automatically woven into this timeline as celebrations conclude.
        </p>
      </div>

      {/* Years Timeline List or Arched Mandap Inaugural Message */}
      {pastYears.length > 0 ? (
        <div className="space-y-12 relative before:absolute before:left-4 sm:before:left-1/2 before:top-0 before:bottom-0 before:w-0.5 before:bg-charcoal-800">
          {pastYears.map((y, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={y.id}
                className={`relative flex flex-col sm:flex-row items-center gap-8 ${
                  isEven ? 'sm:flex-row-reverse' : ''
                }`}
              >
                {/* Timeline Center Indicator */}
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-6 h-6 bg-charcoal-900 border-2 border-gold-500 text-gold-400 flex items-center justify-center z-10 shadow-glow-gold rotate-45">
                  <span className="w-2 h-2 bg-gold-400" />
                </div>

                {/* Card Content — Stepped Temple Pedestal Cards */}
                <div className="w-full sm:w-1/2 pl-12 sm:pl-0 sm:pr-8 sm:text-right">
                  <Link
                    href={`/${y.slug}`}
                    className="group block border-l-2 border-gold-500/60 bg-charcoal-900/80 p-6 transition-all duration-500 hover:border-gold-400 hover:shadow-glow-gold hover:-translate-y-1"
                  >
                    <div className="relative w-full h-48 overflow-hidden mb-4 bg-charcoal-950">
                      <Image
                        src={y.cover_image_url || 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=70&w=600&auto=format&fit=crop'}
                        alt={y.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/20 to-transparent" />
                      <div className="absolute top-3 left-3 px-3 py-1 bg-charcoal-950/90 border border-gold-500/40 text-gold-300 font-editorial text-lg font-semibold">
                        {y.year}
                      </div>
                    </div>

                    <h3 className="font-editorial text-2xl text-ivory-50 group-hover:text-gold-300 transition-colors mb-2">
                      {y.title}
                    </h3>

                    {y.description && (
                      <p className="text-xs text-ivory-300/80 line-clamp-2 leading-relaxed mb-4">
                        {y.description}
                      </p>
                    )}

                    <div className="pt-3 border-t border-charcoal-800 flex items-center justify-between text-xs text-ivory-400">
                      <span>{y.memory_count || 0} Preserved Moments</span>
                      <span className="text-gold-400 font-semibold uppercase tracking-[0.15em] text-[10px] group-hover:translate-x-1 transition-transform">
                        Explore Year &rarr;
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Spacer for 2-column layout */}
                <div className="hidden sm:block w-1/2" />
              </div>
            );
          })}
        </div>
      ) : (
        /* Arched Mandap Sanctuary Frame for Inaugural Timeline State */
        <div className="relative rounded-t-[3.5rem] rounded-b-none border-t-2 border-x border-gold-500/40 p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl bg-gradient-to-b from-charcoal-900 via-charcoal-950 to-charcoal-900 overflow-hidden">
          <div className="relative z-10">
            <div className="inline-block py-1 px-6 border-y border-saffron-500/40 bg-saffron-600/10 text-saffron-300 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
              Inaugural Digital Launch
            </div>

            <h3 className="font-editorial text-2xl sm:text-3xl text-ivory-50 font-normal mb-4">
              No Past Celebrations Recorded Yet
            </h3>

            <p className="text-xs sm:text-sm text-ivory-300/80 leading-relaxed max-w-md mx-auto mb-8 font-sans">
              2026 marks the historic inaugural launch of {villageName}&rsquo;s digital memory gallery. As future celebrations complete or historical photos from past years are discovered, they will automatically appear here.
            </p>

            <Link
              href="/2026"
              className="inline-block px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase text-ivory-50 bg-gradient-to-r from-saffron-700 via-saffron-600 to-saffron-700 border-b-2 border-gold-400 shadow-glow-saffron transition-all transform hover:-translate-y-0.5"
            >
              Explore 2026 Inaugural Celebration
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
