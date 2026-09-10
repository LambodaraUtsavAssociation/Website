'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface PWAInstallPromptProps {
  associationName?: string;
  villageName?: string;
}

export default function PWAInstallPrompt({
  associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association',
  villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli',
}: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Test & Preview query parameter for easy testing across devices
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('pwa-preview');
    if (isPreview === 'true' || isPreview === 'ios') {
      if (isPreview === 'ios') setIsIos(true);
      setIsVisible(true);
      return;
    }

    // 1. Don't show if already installed and running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check dismissal cooldown (7 days)
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at');
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !(window.navigator as any).standalone &&
      !userAgent.includes('crios') &&
      !userAgent.includes('fxios');

    if (isIosDevice) {
      setIsIos(true);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chrome / Edge beforeinstallprompt handler
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 5. Track if user successfully installed
    const appInstalledHandler = () => {
      setIsVisible(false);
      setIsInstalled(true);
      try {
        localStorage.setItem('pwa_installed', 'true');
      } catch {
        // Ignore
      }
    };
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
    } catch (err) {
      console.warn('PWA installation prompt error:', err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString());
    } catch {
      // Ignore
    }
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-charcoal-900/95 border border-gold-500/40 p-6 sm:p-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(212,175,55,0.2)] backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Gold Accent Line */}
        <div
          className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent"
          aria-hidden="true"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-ivory-400 hover:text-ivory-100 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Sacred Emblem in Center */}
        <div className="mx-auto w-20 h-20 rounded-2xl border-2 border-gold-400/50 bg-gradient-to-b from-charcoal-800 to-charcoal-950 p-2 shadow-inner-dark mb-4 flex items-center justify-center relative">
          <div
            className="absolute inset-0 rounded-2xl bg-gold-400/20 blur-md -z-10"
            aria-hidden="true"
          />
          <picture>
            <source type="image/webp" srcSet="/images/village_logo_icon.webp" />
            <img
              src="/images/village_logo_icon.png"
              alt={`${associationName} Emblem`}
              width={72}
              height={72}
              className="w-full h-full object-contain drop-shadow-md"
            />
          </picture>
        </div>

        {/* Title */}
        <h3
          id="pwa-dialog-title"
          className="font-editorial text-lg sm:text-xl font-bold text-ivory-50 tracking-wide mb-1"
        >
          Install App
        </h3>

        <p className="text-xs font-semibold text-gold-400 mb-2 truncate">
          {associationName} ({villageName})
        </p>

        <p className="text-xs text-ivory-300/80 leading-relaxed mb-6 px-2">
          Install on your home screen for quick, full-screen offline darshan anytime.
        </p>

        {/* iOS Quick Hint */}
        {isIos && (
          <div className="bg-charcoal-950/85 border border-gold-500/25 rounded-2xl p-3.5 mb-5 text-left text-xs text-ivory-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-gold-300 text-[11px]">
              <Share className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
              <span>Tap Share &rarr; &apos;Add to Home Screen&apos;</span>
            </div>
            <p className="text-[11px] text-ivory-400 leading-snug">
              In Safari, tap the Share icon at the bottom and choose &apos;Add to Home Screen&apos;.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {!isIos && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-saffron-600 via-saffron-500 to-amber-600 hover:brightness-110 active:scale-98 border border-gold-400/60 shadow-glow-saffron transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-gold-100" />
              <span>Install</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-ivory-400 hover:text-ivory-200 hover:bg-white/5 transition-colors cursor-pointer"
          >
            {isIos ? 'Done' : 'Not Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
