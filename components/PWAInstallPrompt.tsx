'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Sparkles } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Don't show if user previously dismissed in this session or installed
    if (typeof window === 'undefined') return;
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('pwa_prompt_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative rounded-2xl bg-charcoal-950/95 border border-gold-500/40 p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3.5">
        {/* Sacred Village Icon */}
        <div className="relative w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden border border-gold-500/30 bg-charcoal-900 flex items-center justify-center">
          <Image
            src="/images/village_logo_icon.png"
            alt="Lambodara Utsav"
            width={44}
            height={44}
            className="object-cover"
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-gold-400 text-[10px] font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-gold-300" />
            <span>Install Village App</span>
          </div>
          <p className="text-xs font-semibold text-ivory-50 truncate mt-0.5">
            Lambodara Utsav Gallery
          </p>
          <p className="text-[10px] text-ivory-400 truncate">
            Instant 1-tap access on your home screen
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 bg-gradient-to-r from-saffron-600 to-saffron-700 border border-gold-400/50 rounded-lg shadow-glow-saffron hover:brightness-110 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="p-1.5 text-ivory-400 hover:text-ivory-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
