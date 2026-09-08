'use client';

import { useState, useEffect } from 'react';
import {
  getFestivalDates,
  getCurrentFestivalDay,
} from '@/lib/festivalDates';

interface CountdownClockProps {
  targetYear?: number;
  className?: string;
}

const calculateInitialTime = (targetYear: number) => {
  const { startDate, endDate } = getFestivalDates(targetYear);
  const now = new Date();

  if (now > endDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true, isEnded: true, festivalDay: 5 };
  }

  if (now >= startDate) {
    const currentDay = getCurrentFestivalDay(targetYear, now);
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true, isEnded: false, festivalDay: currentDay };
  }

  const difference = startDate.getTime() - now.getTime();
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isStarted: false, isEnded: false, festivalDay: 0 };
};

export default function CountdownClock({ targetYear = new Date().getFullYear(), className = '' }: CountdownClockProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateInitialTime(targetYear));

  useEffect(() => {
    const updateTimer = () => {
      setTimeLeft(calculateInitialTime(targetYear));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetYear]);

  // Stage 1: Festival has completed for target year
  if (timeLeft.isEnded) {
    return (
      <div className={`w-full sm:w-auto px-5 py-2.5 rounded-full bg-charcoal-900/90 border border-gold-500/30 text-gold-300 text-[10px] sm:text-xs font-semibold uppercase tracking-widest shadow-xl text-center ${className}`}>
        &bull; Vinayaka Chavithi {targetYear} Celebration Completed & Archived &bull;
      </div>
    );
  }

  // Stage 2: Festival is currently underway (5-Day Celebration)
  if (timeLeft.isStarted) {
    return (
      <div className={`w-full sm:w-auto px-5 py-2.5 rounded-full bg-saffron-600/20 border border-saffron-500/40 text-saffron-300 text-[10px] sm:text-xs font-semibold uppercase tracking-widest animate-pulse shadow-glow-saffron text-center ${className}`}>
        &bull; Festival Celebrations Are Currently Underway (Day {timeLeft.festivalDay} of 5) &bull;
      </div>
    );
  }

  // Stage 3: Live Countdown to Festival Start (Full Width on Mobile, Centered on Web)
  return (
    <div
      className={`w-full sm:w-auto flex items-center justify-between sm:justify-center space-x-1.5 sm:space-x-6 py-2.5 sm:py-3 px-3 sm:px-6 border-x-2 border-gold-500/40 bg-charcoal-950/90 shadow-2xl backdrop-blur-md ${className}`}
      suppressHydrationWarning
    >
      <div className="text-center flex-1 sm:flex-initial min-w-0 sm:min-w-[56px]">
        <span className="block font-editorial text-2xl sm:text-4xl text-gold-400 font-bold leading-none" suppressHydrationWarning>
          {String(timeLeft.days).padStart(2, '0')}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-ivory-400 font-sans font-medium">Days</span>
      </div>
      <span className="text-gold-500/50 font-editorial text-lg sm:text-xl font-light px-0.5 sm:px-0">:</span>
      <div className="text-center flex-1 sm:flex-initial min-w-0 sm:min-w-[56px]">
        <span className="block font-editorial text-2xl sm:text-4xl text-gold-400 font-bold leading-none" suppressHydrationWarning>
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-ivory-400 font-sans font-medium">Hours</span>
      </div>
      <span className="text-gold-500/50 font-editorial text-lg sm:text-xl font-light px-0.5 sm:px-0">:</span>
      <div className="text-center flex-1 sm:flex-initial min-w-0 sm:min-w-[56px]">
        <span className="block font-editorial text-2xl sm:text-4xl text-gold-400 font-bold leading-none" suppressHydrationWarning>
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-ivory-400 font-sans font-medium">Mins</span>
      </div>
      <span className="text-gold-500/50 font-editorial text-lg sm:text-xl font-light px-0.5 sm:px-0">:</span>
      <div className="text-center flex-1 sm:flex-initial min-w-0 sm:min-w-[56px]">
        <span className="block font-editorial text-2xl sm:text-4xl text-gold-400 font-bold leading-none" suppressHydrationWarning>
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-ivory-400 font-sans font-medium">Secs</span>
      </div>
    </div>
  );
}
