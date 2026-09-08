'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ImageOff, Film } from 'lucide-react';
import { isVideoUrl } from '@/lib/mediaUtils';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

interface SafeMediaImageProps {
  src?: string | null;
  poster?: string | null;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  sizes?: string;
  className?: string;
  onLoad?: () => void;
  autoPlayVideo?: boolean;
  isPlaying?: boolean;
}

export default function SafeMediaImage({
  src,
  poster,
  alt,
  fill = true,
  priority = false,
  quality = 85,
  unoptimized,
  sizes = '(max-width: 1024px) 100vw, 50vw',
  className = 'object-cover',
  onLoad,
  autoPlayVideo = false,
  isPlaying = false,
}: SafeMediaImageProps) {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Detect if this is a YouTube video (from src embed URL or poster)
  const isEmbedUrl = typeof src === 'string' && src.includes('youtube.com/embed');
  const ytId =
    (src && extractYouTubeId(src)) ||
    (poster && extractYouTubeId(poster)) ||
    null;

  const isVideo = isVideoUrl(src) || !!ytId || isEmbedUrl;
  // Only treat posterUrl as a valid thumbnail if it's NOT a video/embed URL itself
  const posterUrl =
    poster && !isVideoUrl(poster) && !poster.includes('youtube.com/embed')
      ? poster
      : undefined;
  const hasImageThumbnail = Boolean(posterUrl);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !isVideo || ytId) return;

    if (isPlaying || autoPlayVideo) {
      videoEl.preload = 'auto';
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Play error catch — mobile browsers require user gesture
        });
      }
    } else {
      videoEl.pause();
    }
  }, [isPlaying, autoPlayVideo, isVideo, ytId]);

  const renderUnavailableFallback = () => (
    <div
      className={`${
        fill ? 'absolute inset-0' : 'w-full h-full'
      } bg-gradient-to-b from-charcoal-900 via-charcoal-950 to-charcoal-900 border border-charcoal-800 flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
    >
      <div className="w-10 h-10 rounded-2xl bg-charcoal-850 border border-charcoal-700 flex items-center justify-center text-gold-400 mb-2 shadow-inner">
        {isVideo ? <Film className="w-5 h-5 text-gold-400/80" /> : <ImageOff className="w-5 h-5 text-gold-400/80" />}
      </div>
      <span className="text-xs font-medium text-ivory-300 font-sans tracking-wide">
        {isVideo ? 'Video Not Available' : 'Image Not Available'}
      </span>
      <span className="text-[10px] text-ivory-500 font-sans mt-0.5">
        Media content unavailable
      </span>
    </div>
  );

  if ((!src && !poster && !ytId) || hasError) {
    return renderUnavailableFallback();
  }

  // ── YouTube Video Thumbnail Rendering (Direct Google CDN, bypasses server optimizer) ──
  if (ytId) {
    const ytThumb = posterUrl || getYouTubeThumbnail(ytId, 'hq');
    return (
      <img
        src={ytThumb}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        width={480}
        height={360}
        onLoad={onLoad}
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src.includes('hqdefault.jpg')) {
            target.src = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
          } else {
            setHasError(true);
          }
        }}
        className={`${fill ? 'absolute inset-0 w-full h-full' : 'w-full h-auto'} ${className}`}
      />
    );
  }

  // ── Direct HTML5 Video File (mp4/webm) ───────────────────────────────────────
  if (isVideoUrl(src)) {
    // Not playing — show static image thumbnail
    if (!isPlaying && !autoPlayVideo) {
      if (hasImageThumbnail) {
        return (
          <Image
            src={posterUrl!}
            alt={alt}
            fill={fill}
            priority={priority}
            quality={quality}
            unoptimized={unoptimized}
            sizes={sizes}
            className={className}
            onLoad={onLoad}
            onError={() => setHasError(true)}
          />
        );
      }

      return (
        <div
          className={`${
            fill ? 'absolute inset-0' : 'w-full h-full'
          } bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-950 flex items-center justify-center ${className}`}
        >
          <div className="flex flex-col items-center space-y-1 opacity-50">
            <Film className="w-6 h-6 text-gold-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gold-300">Film</span>
          </div>
        </div>
      );
    }

    // Playing → render HTML5 video element
    return (
      <video
        ref={videoRef}
        src={src || undefined}
        poster={posterUrl || undefined}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedData={onLoad}
        onCanPlay={onLoad}
        onPlay={onLoad}
        onError={() => setHasError(true)}
        className={`${fill ? 'absolute inset-0' : ''} w-full h-full object-cover ${className}`}
      />
    );
  }

  // ── Guard against passing YouTube embed URLs into Next.js Image ──────────────
  if (isEmbedUrl) {
    return renderUnavailableFallback();
  }

  // ── Standard Image (Cloudflare R2, Unsplash, etc.) ──────────────────────────
  return (
    <Image
      src={src!}
      alt={alt}
      fill={fill}
      priority={priority}
      quality={quality}
      unoptimized={unoptimized}
      sizes={sizes}
      className={className}
      onLoad={onLoad}
      onError={() => setHasError(true)}
    />
  );
}
