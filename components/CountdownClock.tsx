'use client';

import { useState, useEffect } from 'react';
import { getFestivalDates } from '@/lib/festivalDates';

interface CountdownClockProps {
  targetYear?: number;
}

const calculateInitialTime = (targetYear: number) => {
  const { startDate } = getFestivalDates(targetYear);
  const now = new Date().getTime();
  const difference = startDate.getTime() - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isStarted: false };
};

export default function CountdownClock({ targetYear = new Date().getFullYear() }: CountdownClockProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateInitialTime(targetYear));

  useEffect(() => {
    const { startDate } = getFestivalDates(targetYear);

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = startDate.getTime() - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isStarted: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetYear]);

  if (timeLeft.isStarted) {
    return (
      <div className="px-4 sm:px-6 py-2 rounded-full bg-saffron-600/20 border border-saffron-500/40 text-saffron-300 text-[10px] sm:text-xs font-semibold uppercase tracking-widest animate-pulse">
        Festival Celebrations Are Currently Underway
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 sm:space-x-6 py-2.5 sm:py-3 px-3.5 sm:px-6 border-x-2 border-gold-500/40 bg-charcoal-950/90 shadow-2xl backdrop-blur-md max-w-full overflow-x-auto no-scrollbar" suppressHydrationWarning>
      <div className="text-center min-w-[44px] sm:min-w-[56px]">
        <span className="block font-editorial text-xl sm:text-4xl text-gold-400 font-bold leading-none" suppressHydrationWarning>
          {String(timeLeft.days).padStart(2, '0')}
        </span>
        <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-ivory-400 font-sans">Days</span>
      </div>
      <span className="text-gold-500/50 font-editorial text-lg sm:text-xl font-light">:</span>
      <div className="text-center min-w-[44px] sm:min-w-[56px]">
        <span className="block font-editorial text-xl sm:text-4xl text-gold-400 font-bold leading-none" suppressHydrationWarning>
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-ivory-400 font-sans">Hours</span>
      </div>
      <span className="text-gold-500/50 font-editorial text-lg sm:text-xl font-light">:</span>
      <div className="text-center min-w-[44px] sm:min-w-[56px]">
        <span className="block font-editorial text-xl sm:text-4xl text-gold-400 font-bold leading-none" suppressHydrationWarning>
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-ivory-400 font-sans">Mins</span>
      </div>
      <span className="text-gold-500/50 font-editorial text-lg sm:text-xl font-light">:</span>
      <div className="text-center min-w-[44px] sm:min-w-[56px]">
        <span className="block font-editorial text-xl sm:text-4xl text-gold-400 font-bold leading-none" suppressHydrationWarning>
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-ivory-400 font-sans">Secs</span>
      </div>
    </div>
  );
}
