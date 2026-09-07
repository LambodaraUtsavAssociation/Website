'use client';

interface RatLoaderProps {
  message?: string;
  submessage?: string;
}

export default function RatLoader({
  message = 'Loading Sacred Gallery...',
  submessage = 'Lambodara Utsav Association • Papi Reddy Palli',
}: RatLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-center select-none animate-fade-in w-full">
      {/* Sacred Orbit Track Container — Responsively sized (Compact on Mobile, Prominent & Bold on Web) */}
      <div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 flex items-center justify-center mb-6 sm:mb-8">
        {/* Outer Pulsing Golden Ambient Glow */}
        <div className="absolute inset-0 rounded-full bg-saffron-600/15 blur-xl sm:blur-2xl animate-pulse" />

        {/* Outer Static Background Ring */}
        <div className="absolute inset-0 rounded-full border-2 sm:border-3 border-gold-500/20" />

        {/* Rotating Golden Spinner Ring */}
        <div className="absolute inset-0 rounded-full border-2 sm:border-3 border-transparent border-t-gold-400 border-r-saffron-500 border-b-gold-500/40 animate-[spin_1.3s_linear_infinite] shadow-glow-gold" />

        {/* Center Sanctuary Emblem */}
        <div className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-charcoal-900 border-2 sm:border-3 border-gold-400/80 shadow-2xl flex items-center justify-center p-2.5 sm:p-4 z-10">
          <img
            src="/images/village_logo_icon.png"
            alt="Emblem"
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>
      </div>

      {/* Devotional Loading Status */}
      <h3 className="font-editorial text-lg sm:text-2xl md:text-3xl font-bold text-gold-300 tracking-wide mb-1.5 leading-snug max-w-xl">
        {message}
      </h3>
      <p className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.2em] text-ivory-400 font-sans font-semibold max-w-md">
        {submessage}
      </p>
    </div>
  );
}
