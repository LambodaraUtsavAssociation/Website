'use client';

import { useState } from 'react';
import { Share2, Check, Maximize2, Play } from 'lucide-react';
import { Memory } from '@/types';
import SafeMediaImage from './SafeMediaImage';
import { getMediaDisplayInfo, getMasonryAspectClass } from '@/lib/mediaUtils';

interface GalleryCardProps {
  memory: Memory;
  onSelect: (memory: Memory) => void;
  priority?: boolean;
  index?: number;
  variant?: 'standard' | 'reels';
}

export default function GalleryCard({
  memory,
  onSelect,
  priority = false,
  index = 0,
  variant = 'standard',
}: GalleryCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const mediaInfo = getMediaDisplayInfo(memory);
  const isVideo = memory.media_type === 'video';
  const aspectClass = getMasonryAspectClass(index, memory);

  // For YouTube videos, use the YouTube thumbnail (thumbnailUrl / poster) as the card image
  const cardImageUrl =
    isVideo && mediaInfo.isYouTube
      ? mediaInfo.thumbnailUrl || mediaInfo.poster || mediaInfo.url
      : mediaInfo.url;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}?memory=${memory.id}`
        : '';

    const shareData = {
      title: memory.title || 'Lambodara Utsav Memory',
      text:
        memory.description ||
        memory.title ||
        'Check out this memory from Lambodara Utsav (Papi Reddy Palli)!',
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy share link:', err);
      }
    }
  };

  // Dedicated Instagram Reels / Media Grid Variant (Full bleed, tight grid, zero video icons)
  if (variant === 'reels') {
    return (
      <div
        onClick={() => onSelect(memory)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden bg-charcoal-950 aspect-[3/4] sm:aspect-[4/5] w-full group cursor-pointer select-none rounded-none sm:rounded-sm border-0 transition-all duration-300"
      >
        <SafeMediaImage
          src={cardImageUrl}
          poster={mediaInfo.poster}
          alt={memory.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 25vw"
          className={`object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
            isLoaded ? 'opacity-100 blur-0' : 'opacity-90 blur-sm'
          }`}
          onLoad={() => setIsLoaded(true)}
        />

        {/* Subtle Bottom Vignette on Hover with Title */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5 sm:p-3 pointer-events-none z-10">
          <p className="font-sans text-[11px] sm:text-xs font-semibold text-ivory-50 line-clamp-2 leading-snug drop-shadow-md">
            {memory.title}
          </p>
          {memory.category && (
            <span className="text-[10px] text-gold-400 font-sans tracking-wide mt-0.5">
              {memory.category.name}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(memory)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-sm sm:rounded-3xl bg-charcoal-900 border-0 sm:border border-charcoal-800/80 shadow-sm sm:shadow-md transition-all duration-500 group-hover:border-gold-500/40 group-hover:shadow-2xl group-hover:shadow-gold-500/10 group-hover:-translate-y-1">
        {/* Instagram/Reels Aspect Ratio Media Container */}
        <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-charcoal-950">
          <SafeMediaImage
            src={cardImageUrl}
            poster={mediaInfo.poster}
            alt={memory.title}
            fill
            priority={priority}
            isPlaying={isHovered}
            autoPlayVideo={false}
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-700 group-hover:scale-105 ${
              isLoaded ? 'opacity-100 blur-0' : 'opacity-90 blur-sm'
            }`}
            onLoad={() => setIsLoaded(true)}
          />

          {/* Desktop Top Category Badge */}
          {memory.category && (
            <div className="hidden sm:block absolute top-3 left-3 z-20 px-3 py-1 rounded-full bg-charcoal-950/75 backdrop-blur-md border border-ivory-50/15 text-ivory-200 text-[11px] font-sans font-medium">
              {memory.category.name}
            </div>
          )}

          {/* Centered Play Button Overlay for Videos */}
          {isVideo && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl shadow-red-600/30 border border-white/40 transform transition-all duration-300 group-hover:scale-110 group-hover:bg-red-500">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white translate-x-0.5" />
              </div>
            </div>
          )}

          {/* Video Badge Overlay — Mobile White Reel Icon vs Desktop Film Badge */}
          {isVideo && (
            <>
              {/* Mobile Reel Icon (Top Right) */}
              <div className="sm:hidden absolute top-1.5 right-1.5 z-20 p-0.5 drop-shadow-md">
                <div className="w-5 h-5 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <Play className="w-2.5 h-2.5 fill-white text-white translate-x-[0.5px]" />
                </div>
              </div>

              {/* Desktop Film Badge */}
              <div className="hidden sm:flex absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-charcoal-950/85 backdrop-blur-md border border-gold-500/50 text-gold-300 font-semibold text-[10px] tracking-widest uppercase items-center space-x-1 shadow-md">
                <Play className="w-3 h-3 fill-gold-400 text-gold-400" />
                <span>VIDEO</span>
              </div>
            </>
          )}

          {/* Hero Highlight / Featured Badge */}
          {memory.is_featured && (
            <div
              className={`absolute z-20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-gold-500/95 text-charcoal-950 text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold shadow-lg shadow-gold-500/20 flex items-center space-x-1 ${
                isVideo
                  ? 'bottom-3 right-3 sm:bottom-auto sm:top-10 sm:right-3'
                  : 'top-2 sm:top-3 right-2 sm:right-3'
              }`}
            >
              <span>★</span>
              <span>HERO</span>
            </div>
          )}

          {/* Mobile Bottom Caption Overlay */}
          <div className="absolute inset-x-0 bottom-0 z-20 p-1.5 sm:hidden bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <p className="font-sans text-[11px] font-bold text-ivory-50 line-clamp-2 leading-tight drop-shadow-md">
              {memory.title}
            </p>
          </div>

          {/* Hover Dark Overlay with Center Quick Expand Button (Desktop & Touch) */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 z-20">
            <div className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gold-500/90 backdrop-blur-md text-charcoal-950 font-semibold text-[10px] sm:text-xs tracking-widest uppercase shadow-glow-gold transition-transform duration-300 group-hover:scale-105 flex items-center space-x-1.5 sm:space-x-2">
              <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{isVideo ? 'WATCH FILM' : 'VIEW PHOTO'}</span>
            </div>
          </div>
        </div>

        {/* Equalized Bottom Metadata Bar (Desktop Only) */}
        <div className="hidden sm:flex p-3.5 sm:p-4 bg-charcoal-900 border-t border-charcoal-800/50 items-start justify-between gap-2 h-24 sm:h-28">
          <div className="min-w-0 flex-1 h-full flex flex-col justify-between">
            <div>
              <h4 className="font-editorial text-base sm:text-lg text-ivory-100 group-hover:text-gold-300 transition-colors line-clamp-1 leading-snug font-normal">
                {memory.title}
              </h4>

              <p className="text-xs text-ivory-400 line-clamp-1 mt-0.5 font-sans font-normal">
                {memory.description || 'Village celebration memory'}
              </p>
            </div>

            <div className="text-[11px] text-ivory-500 font-sans flex items-center space-x-2">
              <span>{memory.capture_date || 'Vinayaka Chavithi'}</span>
            </div>
          </div>

          {/* Share Link Button */}
          <button
            onClick={handleShare}
            className={`p-2 rounded-full transition-all flex-shrink-0 mt-0.5 flex items-center justify-center ${
              copied
                ? 'bg-gold-500/20 text-gold-300 border border-gold-400/40'
                : 'text-ivory-400 hover:text-gold-300 hover:bg-charcoal-800'
            }`}
            title={copied ? 'Link Copied!' : 'Share Memory Link'}
          >
            {copied ? <Check className="w-4 h-4 text-gold-300" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
