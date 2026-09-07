'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ImageOff, Film } from 'lucide-react';
import { isVideoUrl } from '@/lib/mediaUtils';

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

  const isVideo = isVideoUrl(src);
  const posterUrl = poster && !isVideoUrl(poster) ? poster : undefined;
  const hasImageThumbnail = Boolean(posterUrl);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !isVideo) return;

    if (isPlaying || autoPlayVideo) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Play error catch
        });
      }
    } else {
      videoEl.pause();
    }
  }, [isPlaying, autoPlayVideo, isVideo]);

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

  if (!src || hasError) {
    return renderUnavailableFallback();
  }

  if (isVideo) {
    // If a static image thumbnail is available and video is not playing/hovered: show the thumbnail!
    if (hasImageThumbnail && !isPlaying) {
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

    // Otherwise (no thumbnail image, or playing on hover): render the active video!
    return (
      <video
        ref={videoRef}
        src={src}
        poster={posterUrl}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        onLoadedData={onLoad}
        onCanPlay={onLoad}
        onPlay={onLoad}
        onError={() => setHasError(true)}
        className={`${fill ? 'absolute inset-0' : ''} w-full h-full object-cover ${className}`}
      />
    );
  }

  return (
    <Image
      src={src}
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
