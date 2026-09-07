'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

  // Handle scroll detection for solid background header transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open to prevent page bleed-through
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu automatically on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen
            ? 'bg-charcoal-950/98 backdrop-blur-2xl py-3 shadow-2xl border-b border-gold-500/20'
            : 'bg-gradient-to-b from-charcoal-950/95 via-charcoal-950/70 to-transparent py-4 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo / Brand */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="group flex items-center space-x-2.5 sm:space-x-3 min-w-0"
            >
              <div
                className="relative flex-shrink-0 bg-transparent drop-shadow-md"
                style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
              >
                <picture>
                  <source media="(max-width: 767px)" type="image/svg+xml" srcSet="/images/village_logo_icon.svg" />
                  <img
                    src="/images/village_logo_icon.png"
                    alt={`${associationName} (${villageName}) Emblem`}
                    width={256}
                    height={256}
                    className="object-contain w-[44px] h-[44px]"
                  />
                </picture>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-editorial text-base sm:text-xl md:text-2xl font-bold tracking-wide text-ivory-50 group-hover:text-gold-400 transition-colors truncate">
                  {associationName}
                </span>
                <span className="text-[10px] sm:text-[11px] tracking-widest uppercase text-gold-400 font-sans font-semibold -mt-0.5 sm:-mt-1 truncate">
                  {villageName}
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
                    className={`text-xs tracking-widest uppercase transition-all relative py-1 font-bold ${
                      isActive ? 'text-gold-400' : 'text-ivory-200/90 hover:text-ivory-50'
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

            {/* Mobile Hamburger Button */}
            <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                className="p-2 transition-all active:scale-95 flex flex-col justify-center items-center w-10 h-10 relative overflow-hidden focus:outline-none border-0 bg-transparent"
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
      </header>

      {/* Fullscreen Solid Mobile Navigation Backdrop (Screen Below Header Is Completely Hidden & Solid) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[64px] z-40 bg-charcoal-950/98 backdrop-blur-3xl flex flex-col justify-between p-6 overflow-y-auto animate-fade-in border-t border-gold-500/20">
          {/* Menu Items Container */}
          <div className="flex flex-col space-y-3.5 max-w-md mx-auto w-full pt-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold-400/80 mb-1 px-1">
              Navigation Menu &bull; {villageName}
            </span>

            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-bold uppercase tracking-widest py-3.5 px-4 rounded-xl transition-all flex items-center justify-between border ${
                    isActive
                      ? 'text-gold-300 border-gold-400 bg-saffron-600/20 shadow-glow-gold'
                      : 'text-ivory-100 border-charcoal-800 bg-charcoal-900/80 hover:bg-charcoal-800 hover:border-gold-500/30'
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-gold-400 shadow-glow-gold" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Footer Branding inside Open Mobile Menu */}
          <div className="max-w-md mx-auto w-full pt-6 border-t border-charcoal-850 text-center space-y-1">
            <span className="block font-editorial text-base font-semibold text-ivory-100">
              {associationName}
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-gold-400 font-sans">
              {villageName} &bull; Vinayaka Chavithi Digital Sanctuary
            </span>
          </div>
        </div>
      )}
    </>
  );
}
