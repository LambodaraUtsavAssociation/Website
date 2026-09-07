'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Play,
  Sparkles,
} from 'lucide-react';
import { Memory } from '@/types';
import SafeMediaImage from './SafeMediaImage';
import { getMediaDisplayInfo } from '@/lib/mediaUtils';

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

  const currentMemory = selectedIndex !== null ? memories[selectedIndex] : null;

  const handlePrev = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      onNavigate(selectedIndex - 1);
    } else if (selectedIndex === 0 && memories.length > 0) {
      onNavigate(memories.length - 1);
    }
  }, [selectedIndex, memories.length, onNavigate]);

  const handleNext = useCallback(() => {
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
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?memory=${currentMemory.id}`
      : '';

    const shareData = {
      title: currentMemory.title || 'Lambodara Utsav Memory',
      text: currentMemory.description || currentMemory.title || 'Check out this memory from Lambodara Utsav (Papi Reddy Palli)!',
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
      className="fixed inset-0 z-50 flex flex-col bg-charcoal-950/98 backdrop-blur-xl overflow-y-auto animate-fade-in text-ivory-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* YouTube Style Header Bar — Full Screen Width */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-charcoal-900/95 border-b border-gold-500/20 backdrop-blur-md shadow-lg">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gold-500/20 p-0.5 border border-gold-400/60 shadow-md">
            <img
              src="/images/village_logo_icon.png"
              alt="Emblem"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="font-editorial text-base font-bold tracking-wide text-ivory-50 truncate">
              {associationName}
            </span>
            <span className="text-[11px] text-gold-400 font-sans tracking-widest uppercase font-semibold truncate">
              {selectedIndex + 1} of {memories.length} &bull; {currentMemory.media_type === 'video' ? 'Film' : 'Photo'}
            </span>
          </div>
        </div>

        {/* High Visibility Close Icon Button */}
        <button
          onClick={onClose}
          aria-label="Close Lightbox"
          className="p-2.5 rounded-full bg-charcoal-850 border border-gold-500/30 text-ivory-100 hover:text-charcoal-950 hover:bg-gold-400 hover:border-gold-400 transition-all shadow-md active:scale-95 flex items-center justify-center focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main YouTube Layout Container — Full Width Horizontally */}
      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start flex-1">
        {/* Left Primary Column: Media Player + Title + Association Info + Action Pills + Description */}
        <div className="w-full lg:flex-1 flex flex-col min-w-0">
          {/* Main Media Player Box with Ambient Glow & Gold Accent Border */}
          <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[66vh] xl:h-[72vh] rounded-2xl overflow-hidden bg-black border border-gold-500/30 shadow-2xl shadow-gold-500/5 flex items-center justify-center">
            {currentMemory.media_type === 'video' ? (
              <video
                src={currentMemory.storage_path}
                controls
                autoPlay
                className="w-full h-full object-contain max-h-[72vh]"
                poster={currentMemory.thumbnail_path || undefined}
              />
            ) : (
              <Image
                src={currentMemory.storage_path}
                alt={currentMemory.title}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 75vw"
              />
            )}
          </div>

          {/* High-Visibility Title */}
          <h1 className="font-editorial text-xl sm:text-3xl font-bold text-ivory-50 mt-4 leading-tight tracking-wide">
            {currentMemory.title}
          </h1>

          {/* Channel Info & YouTube Icon Action Bar Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3.5 pb-4 border-b border-charcoal-800">
            {/* Left: Association Info */}
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-full bg-saffron-600/20 border-2 border-gold-400/60 p-1 flex-shrink-0 flex items-center justify-center shadow-md">
                <img
                  src="/images/village_logo_icon.png"
                  alt="Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-extrabold text-ivory-50 tracking-wide truncate">
                  {associationName}
                </span>
                <span className="text-xs text-gold-400 font-sans font-medium truncate">
                  {villageName} &bull; {currentMemory.capture_date || 'Vinayaka Chavithi 2026'}
                </span>
              </div>
            </div>

            {/* Right: Icon Action Pills (Vivid High-Visibility Styling) */}
            <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-1">
              {/* Like / Devotional Blessing Icon Button */}
              {(() => {
                const bCount = blessingCounts[currentMemory.id] ?? currentMemory.blessing_count ?? 0;
                return (
                  <button
                    onClick={() => toggleLike(currentMemory.id)}
                    className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                      isLiked
                        ? 'bg-saffron-600/30 border-saffron-400 text-saffron-200 shadow-glow-saffron'
                        : 'bg-charcoal-850 border-gold-500/30 text-ivory-100 hover:border-gold-400 hover:text-gold-300'
                    }`}
                    title="Devotional Blessing"
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-saffron-400 text-saffron-400' : 'text-gold-400'}`} />
                    <span>{isLiked ? `Blessed (${bCount})` : bCount > 0 ? `Bless (${bCount})` : 'Bless'}</span>
                  </button>
                );
              })()}

              {/* Share Icon Button */}
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-full bg-charcoal-850 border border-gold-500/30 text-xs font-bold text-ivory-100 hover:text-gold-300 hover:border-gold-400 flex items-center space-x-2 transition-all shadow-md active:scale-95"
                title="Share Memory"
              >
                {copied ? <Check className="w-4 h-4 text-gold-400" /> : <Share2 className="w-4 h-4 text-gold-400" />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>

              {/* Prev / Next Navigation Icon Buttons */}
              <div className="flex items-center space-x-1.5 pl-1.5 border-l border-charcoal-800">
                <button
                  onClick={handlePrev}
                  title="Previous Memory"
                  className="p-2.5 rounded-full bg-charcoal-850 border border-gold-500/30 text-ivory-100 hover:text-gold-400 hover:border-gold-400 transition-all shadow-md active:scale-95"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={handleNext}
                  title="Next Memory"
                  className="p-2.5 rounded-full bg-charcoal-850 border border-gold-500/30 text-ivory-100 hover:text-gold-400 hover:border-gold-400 transition-all shadow-md active:scale-95"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Description Box (High-Visibility Rich Card) */}
          <div className="bg-charcoal-900/95 rounded-2xl p-4 sm:p-5 border border-gold-500/25 text-xs sm:text-sm text-ivory-100 leading-relaxed mt-4 shadow-xl">
            <div className="flex items-center space-x-2.5 mb-2.5">
              {currentMemory.category && (
                <span className="px-3 py-1 rounded-full bg-saffron-600/20 border border-saffron-400/50 text-gold-300 text-xs font-bold uppercase tracking-wider font-sans shadow-sm">
                  {currentMemory.category.name}
                </span>
              )}
              <span className="text-xs text-ivory-300 font-sans font-semibold">
                {currentMemory.capture_date || 'Vinayaka Chavithi'}
              </span>
            </div>
            <p className="font-sans text-ivory-200 text-xs sm:text-sm font-medium leading-relaxed">
              {currentMemory.description || 'Sacred festival memory preserved in the official digital gallery.'}
            </p>
          </div>
        </div>

        {/* Right Column: Up Next / Festival Playlist Sidebar (Vivid High-Visibility YouTube Sidebar) */}
        <aside className="w-full lg:w-96 flex-shrink-0 flex flex-col space-y-3.5">
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
                  className={`group flex items-center space-x-3.5 p-2.5 rounded-xl cursor-pointer transition-all ${isCurrent
                      ? 'bg-gradient-to-r from-saffron-600/25 via-charcoal-900 to-gold-500/10 border-2 border-gold-400 shadow-glow-gold text-ivory-50'
                      : 'bg-charcoal-900/90 border border-charcoal-750 hover:bg-charcoal-850 hover:border-gold-500/40 text-ivory-100 shadow-md'
                    }`}
                >
                  {/* Thumbnail Box */}
                  <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-charcoal-950 flex-shrink-0 border border-gold-500/30 shadow-md">
                    <SafeMediaImage
                      src={mediaInfo.url}
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
                      className={`text-xs font-bold line-clamp-2 leading-snug ${isCurrent ? 'text-gold-300' : 'text-ivory-100 group-hover:text-gold-300'
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
