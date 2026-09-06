'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Memory } from '@/types';

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
  const touchStartX = useRef<number | null>(null);

  const isOpen = selectedIndex !== null && selectedIndex >= 0 && selectedIndex < memories.length;
  const currentMemory = isOpen ? memories[selectedIndex] : null;

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    const nextIdx = (selectedIndex + 1) % memories.length;
    onNavigate(nextIdx);
  }, [selectedIndex, memories.length, onNavigate]);

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    const prevIdx = (selectedIndex - 1 + memories.length) % memories.length;
    onNavigate(prevIdx);
  }, [selectedIndex, memories.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const handleShare = async () => {
    if (!currentMemory) return;
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/2025?memory=${currentMemory.id}` : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentMemory.title,
          text: currentMemory.description || 'Village Vinayaka Chavithi Memory',
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen || !currentMemory) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label={currentMemory.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/95 backdrop-blur-xl animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-charcoal-950/90 to-transparent">
        <div className="flex items-center space-x-3 text-xs text-ivory-300">
          <span className="font-editorial text-lg text-gold-400 font-semibold">
            {selectedIndex + 1} / {memories.length}
          </span>
          <span className="hidden sm:inline font-sans text-ivory-300 uppercase tracking-widest text-[10px]">
            {currentMemory.media_type === 'video' ? 'Cinematic Film' : 'Photographic Memory'}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Share Button */}
          <button
            onClick={handleShare}
            aria-label="Share Memory"
            className="px-4 py-1.5 rounded-full glass-panel border border-charcoal-700 text-xs uppercase tracking-wider font-semibold text-ivory-200 hover:text-gold-400 hover:border-gold-500/40 transition-all"
          >
            <span>{copied ? 'LINK COPIED' : 'SHARE'}</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close Lightbox"
            className="px-4 py-1.5 rounded-full glass-panel border border-charcoal-700 text-xs uppercase tracking-wider font-semibold text-ivory-200 hover:text-ivory-50 hover:bg-charcoal-800 transition-colors focus:outline-none"
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* Navigation Buttons (Clean Text Pills) */}
      <button
        onClick={handlePrev}
        aria-label="Previous Memory"
        className="hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 px-4 py-3 rounded-full glass-panel border border-charcoal-700 text-xs font-semibold uppercase tracking-widest text-ivory-200 hover:text-gold-400 hover:border-gold-500/40 transition-all"
      >
        PREVIOUS
      </button>

      <button
        onClick={handleNext}
        aria-label="Next Memory"
        className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 px-4 py-3 rounded-full glass-panel border border-charcoal-700 text-xs font-semibold uppercase tracking-widest text-ivory-200 hover:text-gold-400 hover:border-gold-500/40 transition-all"
      >
        NEXT
      </button>

      {/* Main Content Area */}
      <div className="w-full h-full max-w-6xl mx-auto px-4 py-16 flex flex-col lg:flex-row items-center justify-center gap-8 z-10">
        {/* Media Container */}
        <div className="relative w-full lg:w-3/4 h-[55vh] lg:h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden bg-charcoal-900 border border-charcoal-800 shadow-2xl">
          {currentMemory.media_type === 'video' ? (
            <div className="w-full h-full flex items-center justify-center bg-black relative">
              <video
                src={currentMemory.storage_path}
                controls
                autoPlay
                className="w-full h-full object-contain max-h-[75vh]"
                poster={currentMemory.thumbnail_path || undefined}
              />
            </div>
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

        {/* Memory Metadata Sidebar */}
        <div className="w-full lg:w-1/4 max-h-[30vh] lg:max-h-[75vh] overflow-y-auto flex flex-col justify-between p-6 glass-panel rounded-2xl border border-charcoal-700">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              {currentMemory.category && (
                <span className="px-2.5 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-[10px] uppercase font-semibold tracking-wider font-sans">
                  {currentMemory.category.name}
                </span>
              )}
            </div>

            <h3 className="font-editorial text-2xl lg:text-3xl text-ivory-50 font-normal leading-snug mb-3">
              {currentMemory.title}
            </h3>

            {currentMemory.description && (
              <p className="text-xs sm:text-sm text-ivory-300/90 leading-relaxed mb-6 font-sans">
                {currentMemory.description}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-charcoal-800 space-y-1.5 text-xs text-ivory-400 font-sans">
            <div>Captured: {currentMemory.capture_date || 'Vinayaka Chavithi'}</div>
            <div>Section: {currentMemory.category?.name || 'General Memory'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
