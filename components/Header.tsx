'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FestivalYear } from '@/types';
import { getActiveFestivalYear } from '@/lib/data/repository';

interface HeaderProps {
  associationName?: string;
  villageName?: string;
}

export default function Header({
  associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association',
  villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli',
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeYear, setActiveYear] = useState<FestivalYear | null>({
    id: 'f2026000-0000-0000-0000-000000002026',
    year: 2026,
    title: 'Vinayaka Chavithi 2026',
    slug: '2026',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const pathname = usePathname();

  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    async function fetchYear() {
      const yearObj = await getActiveFestivalYear();
      if (yearObj) setActiveYear(yearObj);
    }
    fetchYear();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isAdminPage) return null;

  const yearLabel = activeYear ? `${activeYear.year} Celebration` : '2026 Celebration';
  const yearHref = activeYear ? `/${activeYear.slug}` : '/2026';

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: yearLabel, href: yearHref },
    { name: 'Past Years Archive', href: '/archive' },
    { name: 'About Memories', href: '/about' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        isScrolled
          ? 'glass-nav py-3 shadow-xl'
          : 'bg-gradient-to-b from-charcoal-950/90 via-charcoal-950/40 to-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Brand with 12KB WebP icon for instant paint */}
          <Link href="/" className="group flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div
              className="relative flex-shrink-0 bg-transparent drop-shadow-md"
              style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px' }}
            >
              <picture>
                <source media="(max-width: 767px)" type="image/svg+xml" srcSet="/images/village_logo_icon.svg" />
                <img
                  src="/images/village_logo_icon.png"
                  alt={`${associationName} (${villageName}) Emblem`}
                  width={256}
                  height={256}
                  className="object-contain w-[48px] h-[48px]"
                />
              </picture>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-editorial text-base sm:text-xl md:text-2xl font-semibold tracking-wide text-ivory-50 group-hover:text-gold-400 transition-colors truncate">
                {associationName}
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-widest uppercase text-gold-400 font-sans -mt-0.5 sm:-mt-1 truncate">
                {villageName} &bull; Vinayaka Chavithi Digital Gallery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs tracking-widest uppercase transition-all relative py-1 font-semibold ${
                    isActive ? 'text-gold-400' : 'text-ivory-200/80 hover:text-ivory-50'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-saffron-500 to-gold-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin Login Shortcut & Mobile Hamburger Button */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
            <Link
              href="/admin/login"
              aria-label="Admin Login"
              className="hidden sm:flex items-center space-x-1 px-4 py-1.5 rounded-full bg-charcoal-800/80 border border-charcoal-700 text-[11px] uppercase tracking-wider text-ivory-300 hover:text-gold-400 hover:border-gold-500/40 transition-all font-semibold"
            >
              <span>Admin Portal</span>
            </Link>

            {/* Custom Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-lg bg-charcoal-850/90 border border-charcoal-700 hover:border-gold-500/40 transition-all active:scale-95 flex flex-col justify-center items-center w-10 h-10 relative overflow-hidden"
            >
              <div className="flex flex-col justify-between w-5 h-3.5 relative">
                <span
                  className={`block h-0.5 bg-gold-400 rounded-full transition-all duration-300 transform origin-center ${
                    mobileMenuOpen ? 'rotate-45 translate-y-[6px]' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-gold-400 rounded-full transition-all duration-200 ${
                    mobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                  }`}
                />
                <span
                  className={`block h-0.5 bg-gold-400 rounded-full transition-all duration-300 transform origin-center ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-[6px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel border-t border-charcoal-700/80 px-6 py-6 animate-fade-in shadow-2xl">
          <div className="flex flex-col space-y-4 max-w-7xl mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-semibold uppercase tracking-wider py-2 transition-colors ${
                  pathname === link.href ? 'text-gold-400 pl-3 border-l-2 border-gold-400 bg-gold-500/5' : 'text-ivory-200 hover:text-ivory-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-charcoal-800 flex items-center justify-between">
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs uppercase tracking-wider font-semibold text-gold-400/90 hover:text-gold-400 py-1"
              >
                Authorized Admin Portal &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
