'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, WifiOff, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Page Error caught by root error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="relative max-w-lg w-full bg-charcoal-900/90 border border-gold-500/30 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-md">
        {/* Top & Bottom Temple Gateway Accent Diamonds */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gold-400 rotate-45 border border-charcoal-950" />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gold-400 rotate-45 border border-charcoal-950" />

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-charcoal-850 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-inner">
          <WifiOff className="w-8 h-8 text-gold-400/90" />
        </div>

        {/* Subtitle Badge */}
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-gold-400 mb-2 block">
          Connection Interrupted
        </span>

        {/* Heading */}
        <h1 className="font-editorial text-3xl sm:text-4xl text-ivory-50 mb-3 font-normal">
          Devotional Stream Paused
        </h1>

        {/* Message */}
        <p className="text-sm text-ivory-300 max-w-md mx-auto mb-8 leading-relaxed font-sans">
          We encountered a network issue or temporary interruption while loading sacred festival
          memories. Please verify your internet connection and try again.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-saffron-600 to-saffron-700 hover:from-saffron-500 hover:to-saffron-600 text-ivory-50 text-xs font-semibold uppercase tracking-[0.2em] border-b-2 border-gold-400 shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-charcoal-850 hover:bg-charcoal-800 text-ivory-200 text-xs font-semibold uppercase tracking-[0.15em] border border-charcoal-700 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-gold-400/70" />
            <span>Return Home</span>
          </Link>
        </div>

        {/* Digest debug info (subtle) */}
        {error?.digest && (
          <p className="mt-8 text-[10px] font-mono text-ivory-600">
            Error Digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
