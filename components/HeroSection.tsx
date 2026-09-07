'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FestivalYear, Memory } from '@/types';
import CountdownClock from './CountdownClock';
import SafeMediaImage from './SafeMediaImage';
import { getHeroBucketMedia } from '@/lib/data/repository';

interface HeroSectionProps {
  festivalYear: FestivalYear;
  memories?: Memory[];
  associationName?: string;
  villageName?: string;
}

interface HeroMediaItem {
  url: string;
  caption: string;
  alt: string;
  isVideo?: boolean;
}

const INAUGURAL_VILLAGE_IMAGES: HeroMediaItem[] = [
  {
    url: '/images/hero/ganesha_front.webp',
    caption: 'Mandap & Clay Idol Shrine',
    alt: 'Clay Lord Vinayakaa idol seated inside an authentic village mandap with clay tiles and banana leaves',
    isVideo: false,
  },
  {
    url: '/images/hero/ganesha_mandap.webp',
    caption: 'Papi Reddy Palli Gathering',
    alt: 'Village community gathered around the decorated Vinayaka Chavithi pandal under coconut palms',
    isVideo: false,
  },
  {
    url: '/images/hero/ganesha_angle.webp',
    caption: 'Rustic Clay Temple Shrine',
    alt: 'Handcrafted clay Vinayakaa idol decorated with mango leaves and marigold flowers',
    isVideo: false,
  },
  {
    url: '/images/hero/ganesha_aarti.webp',
    caption: 'Evening Aarti Ceremony',
    alt: 'Atmospheric evening Aarti with brass deepam oil lamps in an open-air village mandap',
    isVideo: false,
  },
  {
    url: '/images/hero/ganesha_crown.webp',
    caption: 'Sacred Clay Diya Illumination',
    alt: 'Close-up of clay Vinayakaa idol adorned with marigold garlands, sugarcane, and clay diyas',
    isVideo: false,
  },
];

export default function HeroSection({
  festivalYear,
  memories = [],
  associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association',
  villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli',
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroBucketMedia, setHeroBucketMedia] = useState<HeroMediaItem[]>([]);
  const currentCalYear = new Date().getFullYear();

  // Fetch dedicated Hero Section bucket media (images or videos)
  useEffect(() => {
    let isMounted = true;
    getHeroBucketMedia().then((media) => {
      if (isMounted && media && media.length > 0) {
        setHeroBucketMedia(media);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Use dedicated Hero Section bucket media if present, otherwise fallback to inaugural visuals
  const carouselMedia = heroBucketMedia.length > 0 ? heroBucketMedia : INAUGURAL_VILLAGE_IMAGES;

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (carouselMedia.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselMedia.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselMedia.length]);

  return (
    <section className="relative w-full h-screen h-[100dvh] max-h-[100dvh] flex flex-col justify-center items-center overflow-hidden bg-charcoal-950">
      {/* Dynamic Background Carousel with Full HD Crisp Clarity */}
      <div className="absolute inset-0 z-0">
        {carouselMedia.map((item, idx) => {
          const isVideo = item.isVideo || /\.(mp4|webm|ogg|mov|m4v)$/i.test(item.url);
          return (
            <div
              key={item.url + idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {isVideo ? (
                <video
                  src={item.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <SafeMediaImage
                  src={item.url}
                  alt={item.alt}
                  fill
                  priority={idx === 0}
                  quality={95}
                  unoptimized={true}
                  className="w-full h-full object-cover object-center transition-transform duration-10000 ease-linear scale-[1.02]"
                  sizes="100vw"
                />
              )}
            </div>
          );
        })}

        {/* Dark Gradient Overlay for Readability */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-charcoal-950 via-charcoal-950/50 to-black/30 pointer-events-none" />
      </div>

      {/* Hero Content — Adjusted to Bottom-Left on Mobile & Centered on Desktop */}
      <div className="relative z-30 max-w-5xl mx-auto px-5 sm:px-6 w-full flex flex-col justify-end items-start text-left sm:justify-center sm:items-center sm:text-center h-full pt-20 pb-10 sm:pt-20 sm:pb-8">
        {/* Cultural Arched Status Banner — Identical to Web */}
        <div className="relative py-1.5 sm:py-2 px-5 sm:px-8 border-y-2 border-gold-500/40 bg-charcoal-950/85 backdrop-blur-md mb-3 sm:mb-6 max-w-full shadow-lg self-start sm:self-center">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gold-400 rotate-45 border border-charcoal-950" />
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.25em] text-gold-300 block truncate">
            Inaugural Digital Launch &bull; Sept 14, {currentCalYear}
          </span>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gold-400 rotate-45 border border-charcoal-950" />
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-6xl lg:text-7xl tracking-tight text-ivory-50 mb-2 sm:mb-4 leading-tight sm:leading-none drop-shadow-lg text-left sm:text-center">
          <span className="text-gold-400 text-xs sm:text-base md:text-lg font-sans tracking-[0.25em] uppercase block mb-1 sm:mb-3 font-semibold">
            {villageName}
          </span>
          <span className="font-extrabold block text-ivory-50 mb-1 sm:mb-3">
            {associationName}
          </span>
          <span className="font-normal text-ivory-100">
            Vinayaka Chavithi{' '}
          </span>
          <span className="font-bold font-year text-gradient-gold inline-block">
            2026
          </span>
        </h1>

        {/* Subtitle / Documentary Tagline */}
        <p className="font-editorial italic text-xs sm:text-xl md:text-2xl text-ivory-100 max-w-2xl mb-4 sm:mb-6 leading-relaxed drop-shadow-md text-left sm:text-center">
          &ldquo;A celebration of faith, lights, tradition, and the memories we create together.&rdquo;
        </p>

        {/* Live Countdown Clock */}
        <div className="mb-5 sm:mb-8 w-full flex justify-start sm:justify-center">
          <CountdownClock targetYear={currentCalYear} />
        </div>

        {/* Action Buttons — Identical Web Styling */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2.5 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
          <Link
            href="/2026"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 text-xs font-semibold tracking-[0.18em] sm:tracking-[0.2em] uppercase text-ivory-50 bg-gradient-to-r from-saffron-700 via-saffron-600 to-saffron-700 border-b-2 border-gold-400 shadow-glow-saffron transition-all transform active:scale-95 sm:hover:-translate-y-0.5 text-center"
          >
            Explore 2026 Celebration
          </Link>
          <Link
            href="/about"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 text-xs font-semibold tracking-[0.18em] sm:tracking-[0.2em] uppercase text-ivory-200 glass-panel border-b-2 border-charcoal-600 hover:border-gold-500/40 hover:text-ivory-50 transition-all backdrop-blur-md text-center"
          >
            Our Vision
          </Link>
        </div>
      </div>
    </section>
  );
}
