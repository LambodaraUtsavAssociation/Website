'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Music, Square, Play } from 'lucide-react';

export default function DevotionalFlowerShower() {
  const [isShowering, setIsShowering] = useState(false);
  const [columnCount, setColumnCount] = useState(3);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback State with rapid-click resilience
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isPlayingAudioRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Safely stop audio with zero race conditions (even if in-flight or rapid-clicked)
  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    isPlayingAudioRef.current = false;
    setIsPlayingAudio(false);

    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          if (!isPlayingAudioRef.current) {
            audio.pause();
          }
        })
        .catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  // Safely play audio with zero race conditions
  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    isPlayingAudioRef.current = true;
    setIsPlayingAudio(true);

    const promise = audio.play();
    playPromiseRef.current = promise;
    promise
      .then(() => {
        playPromiseRef.current = null;
        // If user rapidly clicked pause before play promise resolved, pause now
        if (!isPlayingAudioRef.current) {
          audio.pause();
        }
      })
      .catch((err) => {
        playPromiseRef.current = null;
        if (err.name !== 'AbortError') {
          isPlayingAudioRef.current = false;
          setIsPlayingAudio(false);
        }
      });
  }, []);

  // Ultra-responsive Audio Toggle (Safely handles rapid play/pause spam)
  const toggleAudio = () => {
    // Devotional haptic touch feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([15, 30, 15]);
      } catch {
        // Fallback
      }
    }

    if (isPlayingAudioRef.current) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  // Automatically stop Aarti whenever ANY video starts playing on the website
  // Stays stopped until the user manually clicks the Aarti button again
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Capture-phase DOM listener catches any native HTML5 <video> starting playback
    const handleGlobalMediaPlay = (event: Event) => {
      const target = event.target as HTMLMediaElement;
      // Ignore our own jaidev audio element and muted background videos (like flower shower)
      if (target === audioRef.current || target?.muted) return;

      stopAudio();
    };

    window.addEventListener('play', handleGlobalMediaPlay, true);

    // 2. Custom event listener for embedded players (YouTube iframe in lightbox, etc.)
    const handleCustomVideoPlay = () => {
      stopAudio();
    };

    window.addEventListener('festival-video-play', handleCustomVideoPlay);

    return () => {
      window.removeEventListener('play', handleGlobalMediaPlay, true);
      window.removeEventListener('festival-video-play', handleCustomVideoPlay);
    };
  }, [stopAudio]);

  // Dynamically calculate the number of side-by-side columns based on screen width
  // Ensures every screen size (from 360px mobile to 4K ultrawide) is completely covered
  const updateColumnCount = useCallback(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    if (width < 540) {
      // Mobile screens: 1 full-width column
      setColumnCount(1);
    } else if (width < 900) {
      // Small tablets / large foldables: 2 side-by-side columns
      setColumnCount(2);
    } else if (width < 1400) {
      // Standard desktop laptops: 3 side-by-side columns
      setColumnCount(3);
    } else if (width < 2000) {
      // Full HD monitors: 4 side-by-side columns
      setColumnCount(4);
    } else {
      // Ultrawide / 4K monitors: 5-6 side-by-side columns
      setColumnCount(5);
    }
  }, []);

  useEffect(() => {
    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, [updateColumnCount]);

  // Trigger the side-by-side flower animation
  const triggerFlowerShower = useCallback(() => {
    setIsShowering(true);

    // Devotional haptic touch feedback on supported devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([20, 35, 20]);
      } catch {
        // Fallback for browsers with restricted haptic permissions
      }
    }

    // Play all side-by-side videos simultaneously
    videoRefs.current.forEach((video) => {
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => {
          // Handled if browser blocks video play
        });
      }
    });

    // Safety timeout in case video ends or loops
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsShowering(false);
    }, 5500);
  }, []);

  // Listen for external trigger events (e.g. when user clicks "Bless" in MemoryViewerModal)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleExternalTrigger = () => {
      triggerFlowerShower();
    };

    window.addEventListener('trigger-flower-shower', handleExternalTrigger);
    return () => {
      window.removeEventListener('trigger-flower-shower', handleExternalTrigger);
    };
  }, [triggerFlowerShower]);

  const handleVideoEnded = () => {
    // Smoothly fade out when animation finishes
    setIsShowering(false);
  };

  return (
    <>
      {/* Full-Screen Side-by-Side Falling Flower Shower Overlay */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 pointer-events-none z-[100] flex flex-row items-stretch justify-center overflow-hidden transition-opacity duration-500 ${
          isShowering ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {Array.from({ length: columnCount }).map((_, index) => (
          <div
            key={index}
            className="flex-1 h-full relative overflow-hidden pointer-events-none"
            style={{ minWidth: `${100 / columnCount}%` }}
          >
            <video
              ref={(el) => {
                videoRefs.current[index] = el;
              }}
              src="/flower.webm"
              playsInline
              muted
              preload="auto"
              className="w-full h-full object-cover object-top pointer-events-none mix-blend-screen"
              onEnded={handleVideoEnded}
            />
          </div>
        ))}
      </div>

      {/* Hidden Devotional Audio Element */}
      <audio
        ref={audioRef}
        src="/jaidev_jaidev.mp3"
        preload="auto"
        loop
        onEnded={() => {
          isPlayingAudioRef.current = false;
          setIsPlayingAudio(false);
        }}
      />

      {/* Devotional Floating Action Dock (Bottom Right) */}
      <div className="fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-40 flex flex-col items-center space-y-3">
        {/* Button 1: Sacred Aarti MP3 Player (ON TOP) */}
        <div className="relative group">
          {/* Pulsing Sacred Halo when Playing */}
          {isPlayingAudio && (
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-500 via-saffron-500 to-gold-400 opacity-80 blur-md animate-pulse pointer-events-none" />
          )}

          <button
            onClick={toggleAudio}
            type="button"
            aria-label={
              isPlayingAudio ? 'జై దేవ్ జై దేవ్ • Stop Aarti' : 'జై దేవ్ జై దేవ్ • Play Aarti'
            }
            className={`relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full transition-all duration-300 shadow-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-400 active:scale-90 hover:scale-105 ${
              isPlayingAudio
                ? 'bg-gradient-to-tr from-red-600 via-saffron-500 to-gold-400 text-charcoal-950 border border-gold-200 shadow-gold-500/50'
                : 'bg-charcoal-900/90 hover:bg-charcoal-800 text-gold-400 border border-gold-500/50 hover:border-gold-400 shadow-black/60'
            }`}
          >
            {isPlayingAudio ? (
              <div className="flex items-center space-x-0.5">
                {/* Live Equalizer Sound Bars */}
                <span className="w-1 h-3.5 bg-charcoal-950 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-4.5 bg-charcoal-950 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-3 bg-charcoal-950 rounded-full animate-bounce [animation-delay:-0.45s]" />
              </div>
            ) : (
              <Music className="w-5 h-5 text-gold-400 transition-transform duration-300 group-hover:scale-110" />
            )}
          </button>

          {/* Devotional Tooltip for Audio Button */}
          <div className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="px-3 py-1.5 rounded-xl bg-charcoal-900/95 backdrop-blur-md border border-gold-500/40 text-gold-300 text-xs font-semibold whitespace-nowrap shadow-xl shadow-black/60 flex items-center space-x-1.5">
              <span>{isPlayingAudio ? 'జై దేవ్' : 'జై దేవ్'}</span>
            </div>
          </div>
        </div>

        {/* Button 2: Flower Shower Offering (BELOW) */}
        <div className="relative group">
          {/* Sacred Golden Halo Glow Behind Button */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-gold-500 via-amber-500 to-saffron-500 opacity-60 blur-md group-hover:opacity-100 animate-pulse transition-opacity duration-500 pointer-events-none" />

          {/* Offering Button */}
          <button
            onClick={triggerFlowerShower}
            type="button"
            aria-label="పుష్పార్చన • Offer Flower Shower"
            className="relative flex items-center justify-center w-13 h-13 sm:w-15 sm:h-15 p-3 sm:p-3.5 rounded-full bg-gradient-to-tr from-amber-600 via-gold-500 to-amber-300 text-charcoal-950 shadow-2xl shadow-gold-500/40 border border-gold-200/80 transform transition-all duration-300 hover:scale-110 active:scale-90 hover:rotate-12 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-charcoal-950"
          >
            {/* Custom Sacred Marigold Flower Icon */}
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 text-charcoal-950 drop-shadow-sm fill-current transform transition-transform duration-300 group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Petals */}
              <circle cx="12" cy="5.5" r="2.5" fill="#2d1600" opacity="0.85" />
              <circle cx="12" cy="18.5" r="2.5" fill="#2d1600" opacity="0.85" />
              <circle cx="5.5" cy="12" r="2.5" fill="#2d1600" opacity="0.85" />
              <circle cx="18.5" cy="12" r="2.5" fill="#2d1600" opacity="0.85" />
              <circle cx="7.4" cy="7.4" r="2.5" fill="#2d1600" opacity="0.85" />
              <circle cx="16.6" cy="7.4" r="2.5" fill="#2d1600" opacity="0.85" />
              <circle cx="7.4" cy="16.6" r="2.5" fill="#2d1600" opacity="0.85" />
              <circle cx="16.6" cy="16.6" r="2.5" fill="#2d1600" opacity="0.85" />
              {/* Golden Core */}
              <circle cx="12" cy="12" r="3.2" fill="#fff" />
              <circle cx="12" cy="12" r="2" fill="#e65100" />
            </svg>
          </button>

          {/* Devotional Tooltip for Desktop */}
          <div className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="px-3.5 py-1.5 rounded-xl bg-charcoal-900/95 backdrop-blur-md border border-gold-500/40 text-gold-300 text-xs font-semibold whitespace-nowrap shadow-xl shadow-black/60 flex items-center space-x-1.5">
              <span>పుష్పార్చన</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
