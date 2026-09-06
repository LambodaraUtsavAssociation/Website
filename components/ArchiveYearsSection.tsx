import Link from 'next/link';
import Image from 'next/image';
import { FestivalYear } from '@/types';

interface ArchiveYearsSectionProps {
  years: FestivalYear[];
  villageName?: string;
}

export default function ArchiveYearsSection({
  years,
  villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli',
}: ArchiveYearsSectionProps) {
  const currentYear = new Date().getFullYear();
  // Show section ONLY if at least one past published year exists before the current year
  const pastYears = (years || []).filter((y) => y.year < currentYear && y.is_published);

  if (pastYears.length === 0) return null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-charcoal-800">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold mb-2 block">
            Digital Visual History
          </span>
          <h2 className="font-editorial text-3xl sm:text-5xl text-ivory-50 font-normal">
            Past Celebrations Timeline
          </h2>
        </div>
        <p className="text-xs text-ivory-400 max-w-xs mt-2 sm:mt-0 leading-relaxed font-sans">
          Each year becomes a chapter in our village&rsquo;s permanent digital legacy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {pastYears.map((y) => (
          <Link
            key={y.id}
            href={`/${y.slug}`}
            className="group relative rounded-3xl overflow-hidden glass-panel border border-charcoal-700/80 cursor-pointer p-6 flex flex-col justify-between transition-all duration-500 hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-glow-gold"
          >
            {/* Background Image Preview */}
            <div className="relative w-full h-52 rounded-2xl overflow-hidden mb-6 bg-charcoal-900">
              <Image
                src={y.cover_image_url || 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=70&w=600&auto=format&fit=crop'}
                alt={y.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/20 to-transparent" />

              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-charcoal-950/80 backdrop-blur-md border border-gold-500/40 text-gold-300 font-editorial text-lg font-semibold">
                {y.year}
              </div>
            </div>

            <div>
              <h3 className="font-editorial text-2xl text-ivory-50 group-hover:text-gold-300 transition-colors mb-2">
                {y.title}
              </h3>
              {y.description && (
                <p className="text-xs text-ivory-300/80 line-clamp-2 leading-relaxed mb-4">
                  {y.description}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-charcoal-800 flex items-center justify-between text-xs text-ivory-400">
              <span className="uppercase tracking-widest text-[10px]">
                {y.memory_count || 0} Preserved Moments
              </span>
              <span className="text-gold-400 font-semibold uppercase tracking-widest text-[10px] group-hover:translate-x-1 transition-transform">
                BROWSE &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
