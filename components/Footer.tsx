'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FestivalYear } from '@/types';
import { getActiveFestivalYear } from '@/lib/data/repository';

interface FooterProps {
  associationName?: string;
  villageName?: string;
}

export default function Footer({
  associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association',
  villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli',
}: FooterProps) {
  const pathname = usePathname();
  const [activeYear, setActiveYear] = useState<FestivalYear | null>({
    id: 'f2026000-0000-0000-0000-000000002026',
    year: 2026,
    title: 'Vinayaka Chavithi 2026',
    slug: '2026',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    async function fetchYear() {
      const yearObj = await getActiveFestivalYear();
      if (yearObj) setActiveYear(yearObj);
    }
    fetchYear();
  }, [pathname]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const yearLabel = activeYear ? `${activeYear.year} Celebration` : '2026 Celebration';
  const yearHref = activeYear ? `/${activeYear.slug}` : '/2026';

  return (
    <footer className="bg-charcoal-950 border-t border-charcoal-800 text-ivory-200/70 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative warm ambient lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-saffron-600/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
        {/* Brand & Vision */}
        <div className="md:col-span-6 flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <div
              className="relative flex-shrink-0 bg-transparent drop-shadow-md"
              style={{ width: '52px', height: '52px', minWidth: '52px', minHeight: '52px' }}
            >
              <picture>
                <source media="(max-width: 767px)" type="image/svg+xml" srcSet="/images/village_logo_icon.svg" />
                <img
                  src="/images/village_logo_icon.png"
                  alt={`${associationName} (${villageName}) Emblem`}
                  width={256}
                  height={256}
                  className="object-contain w-[52px] h-[52px]"
                />
              </picture>
            </div>
            <div className="flex flex-col">
              <span className="font-editorial text-xl sm:text-2xl text-ivory-50 font-semibold tracking-wide">
                {associationName}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-gold-400 font-sans font-semibold">
                {villageName}
              </span>
            </div>
          </div>

          <p className="font-editorial text-lg text-ivory-300 italic max-w-md">
            &ldquo;Pure devotion. Timeless memories. One association. One celebration.&rdquo;
          </p>

          <p className="text-xs text-ivory-400 leading-relaxed max-w-md">
            Established by {associationName} to preserve every sacred ritual, community gathering, and festive reflection of {villageName} for present and future generations.
          </p>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-6 flex flex-col md:items-end space-y-3">
          <div className="flex flex-col space-y-3 max-w-xs w-full">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gold-400">Navigation</h4>
            <ul className="space-y-2 text-xs uppercase tracking-wider font-medium">
              <li>
                <Link href="/" className="hover:text-ivory-50 transition-colors">
                  Homepage
                </Link>
              </li>
              <li>
                <Link href={yearHref} className="hover:text-ivory-50 transition-colors">
                  {yearLabel}
                </Link>
              </li>
              <li>
                <Link href="/archive" className="hover:text-ivory-50 transition-colors">
                  Past Years Archive
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-ivory-50 transition-colors">
                  About Our Digital Gallery
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-charcoal-850 flex flex-col sm:flex-row items-center justify-between text-xs text-ivory-400 space-y-4 sm:space-y-0">
        <p>&copy; {new Date().getFullYear()} {villageName} Vinayaka Chavithi Digital Gallery.</p>
        <p>Preserved with devotion for our village community</p>
      </div>
    </footer>
  );
}
