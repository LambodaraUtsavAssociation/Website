'use client';

import { useState } from 'react';
import { Memory } from '@/types';
import SafeMediaImage from './SafeMediaImage';
import { getMediaDisplayInfo } from '@/lib/mediaUtils';

interface FeaturedVideoSectionProps {
  video: Memory | null;
  onSelect: (video: Memory) => void;
}

export default function FeaturedVideoSection({ video, onSelect }: FeaturedVideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  if (!video) return null;

  const mediaInfo = getMediaDisplayInfo(video);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-gold-500/30 p-6 sm:p-10 bg-charcoal-900 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Text Information */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-[10px] font-semibold tracking-widest uppercase">
              Cinematic Celebration Film
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl text-ivory-50 font-normal leading-snug">
              {video.title}
            </h2>

            {video.description && (
              <p className="text-sm text-ivory-300/80 leading-relaxed font-sans">
                {video.description}
              </p>
            )}

            <div className="pt-4 flex items-center space-x-4">
              <button
                onClick={() => onSelect(video)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-saffron-600 to-saffron-700 hover:from-saffron-500 hover:to-saffron-600 text-ivory-50 font-semibold text-xs tracking-widest uppercase shadow-glow-saffron transition-all"
              >
                Open Cinema Lightbox Player
              </button>
            </div>
          </div>

          {/* Video Player Display */}
          <div className="lg:col-span-7 relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-charcoal-700 group">
            {!isPlaying ? (
              <div
                onClick={() => setIsPlaying(true)}
                className="relative w-full h-full cursor-pointer flex items-center justify-center"
              >
                <SafeMediaImage
                  src={mediaInfo.url}
                  alt={video.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                {/* Text Play Badge */}
                <div className="relative z-10 px-6 py-3 rounded-full bg-gold-500 text-charcoal-950 font-semibold text-xs tracking-widest uppercase shadow-glow-gold transition-transform group-hover:scale-110">
                  PLAY FILM
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={video.storage_path}
                  controls
                  autoPlay
                  muted={isMuted}
                  className="w-full h-full object-cover"
                />
                {/* Mute Toggle Button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full glass-panel border border-charcoal-700 text-ivory-200 text-[10px] uppercase tracking-wider font-semibold"
                >
                  {isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
