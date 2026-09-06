'use client';

import { useState, useEffect } from 'react';
import {
  getFestivalDates,
  isFestivalActive,
  hasFestivalEnded,
  getCurrentFestivalDay,
} from '@/lib/festivalDates';

interface CountdownClockProps {
  targetYear?: number;
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

export default function CountdownClock({ targetYear = new Date().getFullYear() }: CountdownClockProps) {
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
      <div className="px-5 py-2.5 rounded-full bg-charcoal-900/90 border border-gold-500/30 text-gold-300 text-[10px] sm:text-xs font-semibold uppercase tracking-widest shadow-xl">
        &bull; Vinayaka Chavithi {targetYear} Celebration Completed & Archived &bull;
      </div>
    );
  }

  // Stage 2: Festival is currently underway (5-Day Celebration)
  if (timeLeft.isStarted) {
    return (
      <div className="px-5 py-2.5 rounded-full bg-saffron-600/20 border border-saffron-500/40 text-saffron-300 text-[10px] sm:text-xs font-semibold uppercase tracking-widest animate-pulse shadow-glow-saffron">
        ✨ Festival Celebrations Are Currently Underway (Day {timeLeft.festivalDay} of 5) ✨
      </div>
    );
  }

  // Stage 3: Live Countdown to Festival Start
  return (
    <div
      className="flex items-center space-x-2 sm:space-x-6 py-2.5 sm:py-3 px-3.5 sm:px-6 border-x-2 border-gold-500/40 bg-charcoal-950/90 shadow-2xl backdrop-blur-md max-w-full overflow-x-auto no-scrollbar"
      suppressHydrationWarning
    >
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
