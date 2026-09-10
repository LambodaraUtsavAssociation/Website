'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, Share2, Check, ChevronLeft, ChevronRight, Heart, Play, Sparkles } from 'lucide-react';
import { Memory } from '@/types';
import SafeMediaImage from './SafeMediaImage';
import { getMediaDisplayInfo } from '@/lib/mediaUtils';
import confetti from 'canvas-confetti';

interface MemoryViewerModalProps {
  memories: Memory[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export default function MemoryViewerModal({
  memories,
  selectedIndex,
  onClose,
  onNavigate,
}: MemoryViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const [likedMemories, setLikedMemories] = useState<Record<string, boolean>>({});
  const [blessingCounts, setBlessingCounts] = useState<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);
  const lastNavTime = useRef<number>(0);

  const currentMemory = selectedIndex !== null ? memories[selectedIndex] : null;

  const handlePrev = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTime.current < 120) return;
    lastNavTime.current = now;

    if (selectedIndex !== null && selectedIndex > 0) {
      onNavigate(selectedIndex - 1);
    } else if (selectedIndex === 0 && memories.length > 0) {
      onNavigate(memories.length - 1);
    }
  }, [selectedIndex, memories.length, onNavigate]);

  const handleNext = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTime.current < 120) return;
    lastNavTime.current = now;

    if (selectedIndex !== null && selectedIndex < memories.length - 1) {
      onNavigate(selectedIndex + 1);
    } else if (selectedIndex === memories.length - 1 && memories.length > 0) {
      onNavigate(0);
    }
  }, [selectedIndex, memories.length, onNavigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) handleNext();
      else handlePrev();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onClose, handlePrev, handleNext]);

  // Lock background screen scrolling when modal is open
  useEffect(() => {
    if (selectedIndex === null) return;

    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [selectedIndex]);

  // Automatically pause background devotional audio whenever a video memory is opened/viewed
  useEffect(() => {
    if (selectedIndex === null) return;
    const currentMemory = memories[selectedIndex];
    if (currentMemory && (currentMemory.media_type === 'video' || currentMemory.youtube_video_id)) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('festival-video-play'));
      }
    }
  }, [selectedIndex, memories]);

  // Smart background preloading of adjacent images in gallery
  useEffect(() => {
    if (selectedIndex === null || memories.length <= 1) return;

    const nextIdx = selectedIndex < memories.length - 1 ? selectedIndex + 1 : 0;
    const prevIdx = selectedIndex > 0 ? selectedIndex - 1 : memories.length - 1;

    const preloadImage = (url?: string | null) => {
      if (!url || typeof window === 'undefined') return;
      const img = new window.Image();
      img.decoding = 'async';
      img.src = url;
    };

    const nextMem = memories[nextIdx];
    if (nextMem && nextMem.media_type === 'image') {
      preloadImage(nextMem.full_path || nextMem.storage_path);
    }
    const prevMem = memories[prevIdx];
    if (prevMem && prevMem.media_type === 'image') {
      preloadImage(prevMem.full_path || prevMem.storage_path);
    }
  }, [selectedIndex, memories]);

  useEffect(() => {
    // Load local device blessings
    try {
      const stored = localStorage.getItem('blessed_memories');
      if (stored) {
        setLikedMemories(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }

    // Load server blessing counts
    fetch('/api/memories/bless')
      .then((res) => res.json())
      .then((data) => {
        if (data.blessings) {
          setBlessingCounts(data.blessings);
        }
      })
      .catch(() => {});

    // Set up Real-time Supabase Subscription for instant sync across all users
    let channel: any = null;
    try {
      const { createClient } = require('@/lib/supabase/client');
      const supabase = createClient();

      channel = supabase
        .channel('realtime-blessings-channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'memories' },
          (payload: any) => {
            if (payload.new && payload.new.id) {
              setBlessingCounts((prev) => ({
                ...prev,
                [payload.new.id]: payload.new.blessing_count ?? 0,
              }));
            }
          }
        )
        .on('broadcast', { event: 'blessing-update' }, (payload: any) => {
          if (payload?.payload?.memoryId) {
            const { memoryId, count } = payload.payload;
            setBlessingCounts((prev) => ({
              ...prev,
              [memoryId]: count,
            }));
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription setup warning:', err);
    }

    return () => {
      if (channel) {
        try {
          const { createClient } = require('@/lib/supabase/client');
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const toggleLike = async (id: string) => {
    const isCurrentlyLiked = !!likedMemories[id];
    const newLikedState = !isCurrentlyLiked;
    const action = newLikedState ? 'bless' : 'unbless';

    // 1. Optimistic Local Storage update
    const updatedLiked = { ...likedMemories, [id]: newLikedState };
    setLikedMemories(updatedLiked);
    try {
      localStorage.setItem('blessed_memories', JSON.stringify(updatedLiked));
    } catch {
      // Ignore
    }

    if (newLikedState) {
      // Mobile Haptic Vibration
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([15, 35, 15]);
        } catch {
          // Ignore
        }
      }

      // Trigger the same sacred flower shower video animation across the screen
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trigger-flower-shower'));
      }

      // Sacred Marigold & Rose Petal Shower Burst
      try {
        confetti({
          particleCount: 36,
          spread: 60,
          origin: { y: 0.78 },
          colors: ['#E07A5F', '#C59B27', '#FFB703', '#F4A261', '#E76F51'],
          shapes: ['circle'],
          scalar: 0.95,
          ticks: 120,
          gravity: 1.1,
          decay: 0.94,
        });
      } catch {
        // Ignore
      }
    }

    // 2. Optimistic Count update
    const currentCount = blessingCounts[id] || 0;
    const newCount = newLikedState ? currentCount + 1 : Math.max(0, currentCount - 1);
    setBlessingCounts((prev) => ({ ...prev, [id]: newCount }));

    // 3. Broadcast Real-time event immediately to all active clients
    try {
      const { createClient } = require('@/lib/supabase/client');
      const supabase = createClient();
      supabase.channel('realtime-blessings-channel').send({
        type: 'broadcast',
        event: 'blessing-update',
        payload: { memoryId: id, count: newCount, action },
      });
    } catch {
      // Ignore
    }

    // 4. Persist to Backend DB / Store
    try {
      const res = await fetch('/api/memories/bless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: id, action }),
      });
      const data = await res.json();
      if (data.count !== undefined) {
        setBlessingCounts((prev) => ({ ...prev, [id]: data.count }));
      }
    } catch (err) {
      console.error('Failed to sync blessing count:', err);
    }
  };

  const handleShare = async () => {
    if (!currentMemory) return;
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}?memory=${currentMemory.id}`
        : '';

    const shareData = {
      title: currentMemory.title || 'Lambodara Utsav Memory',
      text:
        currentMemory.description ||
        currentMemory.title ||
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
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Failed to copy share link:', err);
      }
    }
  };

  if (selectedIndex === null || !currentMemory) return null;

  const isLiked = !!likedMemories[currentMemory.id];
  const associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association';
  const villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli';

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label={currentMemory.title}
      className="fixed inset-0 z-50 flex flex-col bg-[#0a0807] overflow-y-auto overscroll-contain animate-fade-in text-ivory-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar — Fixed & Sticky with Safe Area Inset */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3.5 bg-[#0e0c0a]/95 border-b border-gold-500/20 backdrop-blur-md shadow-lg pt-[max(0.625rem,env(safe-area-inset-top))]">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex-shrink-0 bg-gold-500/20 p-0.5 border border-gold-400/60 shadow-md">
            <img
              src="/images/village_logo_icon.png"
              alt="Emblem"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="font-editorial text-sm sm:text-base font-bold tracking-wide text-ivory-50 truncate">
              {associationName}
            </span>
            <span className="text-[10px] sm:text-[11px] text-gold-400 font-sans tracking-widest uppercase font-semibold truncate">
              {selectedIndex + 1} of {memories.length} &bull;{' '}
              {currentMemory.media_type === 'video' ? 'Film' : 'Photo'}
            </span>
          </div>
        </div>

        {/* High Visibility Close Icon Button */}
        <button
          onClick={onClose}
          aria-label="Close Lightbox"
          className="p-2 sm:p-2.5 rounded-full bg-charcoal-800/90 border border-gold-500/30 text-ivory-100 hover:text-charcoal-950 hover:bg-gold-400 hover:border-gold-400 transition-all shadow-md active:scale-95 flex items-center justify-center focus:outline-none flex-shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </header>

      {/* Main YouTube Layout Container — Full Width Horizontally */}
      <main className="w-full max-w-[1920px] mx-auto px-3.5 sm:px-6 md:px-8 lg:px-10 py-3.5 sm:py-6 flex flex-col lg:flex-row gap-5 lg:gap-8 items-start flex-1">
        {/* Left Primary Column: Media Player + Title + Association Info + Action Pills + Description */}
        <div className="w-full lg:flex-1 flex flex-col min-w-0">
          {/* Main Media Player Box */}
          <div className="relative w-full h-[46vh] sm:h-[58vh] lg:h-[66vh] xl:h-[72vh] rounded-2xl overflow-hidden bg-black border border-gold-500/30 shadow-2xl shadow-gold-500/5 flex items-center justify-center">
            {(() => {
              const mediaInfo = getMediaDisplayInfo(currentMemory);
              if (mediaInfo.isYouTube && mediaInfo.youtubeVideoId) {
                return (
                  <iframe
                    key={mediaInfo.youtubeVideoId}
                    src={`https://www.youtube-nocookie.com/embed/${mediaInfo.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                    title={currentMemory.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="w-full h-full"
                    style={{ border: 'none' }}
                  />
                );
              }
              if (currentMemory.media_type === 'video') {
                return (
                  <video
                    src={currentMemory.storage_path}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    className="w-full h-full object-contain max-h-[72vh]"
                    poster={currentMemory.thumbnail_path || undefined}
                  />
                );
              }
              return (
                <Image
                  src={currentMemory.full_path || currentMemory.storage_path}
                  alt={currentMemory.title}
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 75vw"
                />
              );
            })()}
          </div>

          {/* High-Visibility Title */}
          <h1 className="font-editorial text-xl sm:text-2xl lg:text-3xl font-bold text-ivory-50 mt-3.5 sm:mt-4 leading-snug tracking-wide">
            {currentMemory.title}
          </h1>

          {/* Channel / Association Info Row */}
          <div className="flex items-center justify-between gap-3 mt-3 pb-3 border-b border-charcoal-800">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-saffron-600/20 border-2 border-gold-400/60 p-0.5 flex-shrink-0 flex items-center justify-center shadow-md">
                <img
                  src="/images/village_logo_icon.png"
                  alt="Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-ivory-50 tracking-wide truncate">
                  {associationName}
                </span>
                <span className="text-[11px] sm:text-xs text-gold-400 font-sans font-medium truncate">
                  {villageName} &bull; {currentMemory.capture_date || 'Vinayaka Chavithi 2026'}
                </span>
              </div>
            </div>

            {currentMemory.category && (
              <span className="px-2.5 py-1 rounded-full bg-saffron-600/20 border border-saffron-400/40 text-gold-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider font-sans flex-shrink-0">
                {currentMemory.category.name}
              </span>
            )}
          </div>

          {/* Action Pills Row: Well Balanced, Aligned Layout */}
          <div className="flex items-center justify-between gap-2.5 mt-3 pb-3.5 border-b border-charcoal-800/80">
            {/* Left: Bless & Share actions */}
            <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
              {/* Like / Devotional Blessing Icon Button */}
              {(() => {
                const bCount =
                  blessingCounts[currentMemory.id] ?? currentMemory.blessing_count ?? 0;
                return (
                  <button
                    onClick={() => toggleLike(currentMemory.id)}
                    className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border text-xs font-bold flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                      isLiked
                        ? 'bg-saffron-600/30 border-saffron-400 text-saffron-200 shadow-glow-saffron'
                        : 'bg-charcoal-850 border-gold-500/30 text-ivory-100 hover:border-gold-400 hover:text-gold-300'
                    }`}
                    title="Devotional Blessing"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiked ? 'fill-saffron-400 text-saffron-400' : 'text-gold-400'}`}
                    />
                    <span className="truncate">
                      {isLiked ? `Blessed (${bCount})` : bCount > 0 ? `Bless (${bCount})` : 'Bless'}
                    </span>
                  </button>
                );
              })()}

              {/* Share Icon Button */}
              <button
                onClick={handleShare}
                className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-charcoal-850 border border-gold-500/30 text-xs font-bold text-ivory-100 hover:text-gold-300 hover:border-gold-400 flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Share Memory"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-400" />
                )}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>

            {/* Right: Prev / Next Navigation Arrows */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <button
                onClick={handlePrev}
                title="Previous Memory"
                aria-label="Previous Memory"
                className="p-2 sm:p-2.5 rounded-full bg-charcoal-850 border border-gold-500/30 text-ivory-100 hover:text-gold-400 hover:border-gold-400 transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                title="Next Memory"
                aria-label="Next Memory"
                className="p-2 sm:p-2.5 rounded-full bg-charcoal-850 border border-gold-500/30 text-ivory-100 hover:text-gold-400 hover:border-gold-400 transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description Box (High-Visibility Rich Card) */}
          <div className="bg-charcoal-900/90 rounded-2xl p-3.5 sm:p-5 border border-gold-500/25 text-xs sm:text-sm text-ivory-100 leading-relaxed mt-3 shadow-xl">
            <p className="font-sans text-ivory-200 text-xs sm:text-sm font-medium leading-relaxed">
              {currentMemory.description ||
                'Sacred festival memory preserved in the official digital gallery.'}
            </p>
          </div>

          {/* Mobile-only: Horizontal thumbnail strip for navigation (replaces the sidebar) */}
          {memories.length > 1 && (
            <div className="lg:hidden mt-4 pb-12">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400">
                  {memories.length} Memories · Swipe or tap to navigate
                </span>
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
                {memories.map((mem, idx) => {
                  const isCurrent = idx === selectedIndex;
                  const mediaInfo = getMediaDisplayInfo(mem);
                  const isVid = mem.media_type === 'video';
                  return (
                    <button
                      key={mem.id}
                      type="button"
                      onClick={() => onNavigate(idx)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                        isCurrent
                          ? 'border-gold-400 shadow-glow-gold ring-1 ring-gold-400'
                          : 'border-charcoal-700 opacity-60'
                      }`}
                    >
                      <SafeMediaImage
                        src={mediaInfo.thumbnailUrl || mediaInfo.poster || mediaInfo.url}
                        poster={mediaInfo.poster}
                        alt={mem.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                      {isVid && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-3.5 h-3.5 fill-white text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Up Next / Festival Playlist Sidebar — hidden on mobile to keep layout clean */}
        <aside className="hidden lg:flex w-full lg:w-96 flex-shrink-0 flex-col space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-gold-500/20">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gold-400 flex items-center space-x-2">
              <span>Up Next &bull; Festival Moments</span>
            </h3>
            <span className="text-xs text-gold-300/80 font-sans font-semibold">
              {memories.length} items
            </span>
          </div>

          {/* Playlist Cards Stack */}
          <div className="max-h-[660px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {memories.map((mem, idx) => {
              const isCurrent = idx === selectedIndex;
              const mediaInfo = getMediaDisplayInfo(mem);
              const isVid = mem.media_type === 'video';

              return (
                <div
                  key={mem.id + idx}
                  onClick={() => onNavigate(idx)}
                  className={`group flex items-center space-x-3.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-saffron-600/25 via-charcoal-900 to-gold-500/10 border-2 border-gold-400 shadow-glow-gold text-ivory-50'
                      : 'bg-charcoal-900/90 border border-charcoal-750 hover:bg-charcoal-850 hover:border-gold-500/40 text-ivory-100 shadow-md'
                  }`}
                >
                  {/* Thumbnail Box */}
                  <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-charcoal-950 flex-shrink-0 border border-gold-500/30 shadow-md">
                    <SafeMediaImage
                      src={mediaInfo.isYouTube ? mediaInfo.poster || mediaInfo.url : mediaInfo.url}
                      poster={mediaInfo.poster}
                      alt={mem.title}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                    {isVid && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-bold text-gold-300 flex items-center space-x-0.5 border border-gold-500/30">
                        <Play className="w-2.5 h-2.5 fill-gold-300 text-gold-300" />
                        <span>FILM</span>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute inset-0 bg-gold-500/20 border-2 border-gold-400 rounded-lg pointer-events-none" />
                    )}
                  </div>

                  {/* Playlist Item Metadata */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-xs font-bold line-clamp-2 leading-snug ${
                        isCurrent ? 'text-gold-300' : 'text-ivory-100 group-hover:text-gold-300'
                      }`}
                    >
                      {mem.title}
                    </h4>
                    <p className="text-[11px] text-ivory-300 font-sans mt-1 truncate font-medium">
                      {mem.category?.name || 'Vinayaka Chavithi'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </main>
    </div>
  );
}
