'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles, ImageOff } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  badge?: string;
  lightMode?: boolean;
}

export default function EmptyState({
  title = 'No Media Memories Found',
  description = 'Our village administrator will upload and publish moments for this section soon.',
  icon,
  actionText,
  actionHref,
  onAction,
  badge = 'Digital Gallery Archive',
  lightMode = false,
}: EmptyStateProps) {
  if (lightMode) {
    return (
      <div className="relative rounded-3xl border-2 border-orange-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs bg-white overflow-hidden my-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent" />

        <div className="relative z-10 flex flex-col items-center">
          {badge && (
            <div className="inline-flex items-center space-x-1.5 py-1 px-3.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase tracking-wider mb-5">
              <Sparkles className="w-3 h-3 text-orange-500" />
              <span>{badge}</span>
            </div>
          )}

          <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-orange-300 flex items-center justify-center text-orange-600 mb-5 shadow-xs">
            {icon || <ImageOff className="w-8 h-8 text-orange-500" />}
          </div>

          <h3 className="text-xl sm:text-2xl text-slate-900 font-bold mb-2">{title}</h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-6 font-sans">
            {description}
          </p>

          {actionText && actionHref && (
            <Link
              href={actionHref}
              className="inline-block px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-orange-500 hover:bg-orange-600 shadow-md transition-all cursor-pointer"
            >
              {actionText}
            </Link>
          )}

          {actionText && !actionHref && onAction && (
            <button
              onClick={onAction}
              type="button"
              className="inline-block px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-orange-500 hover:bg-orange-600 shadow-md transition-all cursor-pointer"
            >
              {actionText}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border border-gold-500/30 p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl bg-gradient-to-b from-charcoal-900 via-charcoal-950 to-charcoal-900 overflow-hidden my-8">
      {/* Decorative Arch Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Badge */}
        {badge && (
          <div className="inline-flex items-center space-x-1.5 py-1 px-4 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-300 text-[10px] font-semibold uppercase tracking-[0.2em] mb-6">
            <Sparkles className="w-3 h-3 text-gold-400" />
            <span>{badge}</span>
          </div>
        )}

        {/* Icon Frame */}
        <div className="w-16 h-16 rounded-2xl bg-charcoal-850 border border-charcoal-700 flex items-center justify-center text-gold-400 mb-6 shadow-glow-gold">
          {icon || <ImageOff className="w-8 h-8 text-gold-400" />}
        </div>

        {/* Title & Description */}
        <h3 className="font-editorial text-2xl sm:text-3xl text-ivory-50 font-normal mb-3 leading-snug">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-ivory-300/80 leading-relaxed max-w-md mx-auto mb-8 font-sans">
          {description}
        </p>

        {/* Action Button */}
        {actionText && actionHref && (
          <Link
            href={actionHref}
            className="inline-block px-7 py-3 text-xs font-semibold tracking-[0.18em] uppercase text-ivory-50 bg-gradient-to-r from-saffron-700 via-saffron-600 to-saffron-700 border-b-2 border-gold-400 shadow-glow-saffron transition-all transform hover:-translate-y-0.5"
          >
            {actionText}
          </Link>
        )}

        {actionText && !actionHref && onAction && (
          <button
            onClick={onAction}
            type="button"
            className="inline-block px-7 py-3 text-xs font-semibold tracking-[0.18em] uppercase text-ivory-50 bg-gradient-to-r from-saffron-700 via-saffron-600 to-saffron-700 border-b-2 border-gold-400 shadow-glow-saffron transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}
