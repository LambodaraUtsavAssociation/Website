import { FestivalYear } from '@/types';

// Vinayaka Chavithi 5-Day Festival Schedule Map
export const FESTIVAL_DATE_MAP: Record<number, { startDate: string; endDate: string }> = {
  2024: { startDate: '2024-09-07', endDate: '2024-09-11' },
  2025: { startDate: '2025-08-27', endDate: '2025-08-31' },
  2026: { startDate: '2026-09-14', endDate: '2026-09-18' }, // 5 Days: Sept 14 to Sept 18
  2027: { startDate: '2027-09-14', endDate: '2027-09-18' },
  2028: { startDate: '2028-08-23', endDate: '2028-08-27' },
  2029: { startDate: '2029-09-11', endDate: '2029-09-15' },
  2030: { startDate: '2030-09-01', endDate: '2030-09-05' },
};

/**
 * Returns the 5-day festival dates for a given year in Indian Standard Time (IST, UTC+05:30).
 */
export function getFestivalDates(year: number) {
  const map = FESTIVAL_DATE_MAP[year];
  const startStr = map ? map.startDate : `${year}-09-14`;
  const endStr = map ? map.endDate : `${year}-09-18`;

  // Explicitly anchor to Indian Standard Time (UTC+05:30) so devotees worldwide see exact festival schedule
  return {
    startDate: new Date(`${startStr}T00:00:00+05:30`),
    endDate: new Date(`${endStr}T23:59:59+05:30`),
  };
}

/**
 * Checks whether the festival has started for a given calendar year.
 */
export function hasFestivalStarted(year: number, currentDate = new Date()): boolean {
  const { startDate } = getFestivalDates(year);
  return currentDate >= startDate;
}

/**
 * Checks whether the festival is currently active (within the 5-day window).
 */
export function isFestivalActive(year: number, currentDate = new Date()): boolean {
  const { startDate, endDate } = getFestivalDates(year);
  return currentDate >= startDate && currentDate <= endDate;
}

/**
 * Checks whether the festival has completed for a given calendar year.
 */
export function hasFestivalEnded(year: number, currentDate = new Date()): boolean {
  const { endDate } = getFestivalDates(year);
  return currentDate > endDate;
}

/**
 * Calculates current day number (Day 1 through Day 5) during festival.
 */
export function getCurrentFestivalDay(year: number, currentDate = new Date()): number {
  const { startDate } = getFestivalDates(year);
  const diffTime = currentDate.getTime() - startDate.getTime();
  const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(5, Math.max(1, dayNumber));
}

/**
 * Calculates days remaining until festival start date.
 */
export function getDaysUntilFestival(year: number, currentDate = new Date()): number {
  const { startDate } = getFestivalDates(year);
  const diffTime = startDate.getTime() - currentDate.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Determines the active FestivalYear to display.
 */
export function getDisplayFestivalYear(
  years: FestivalYear[],
  currentDate = new Date()
): FestivalYear | null {
  const publishedYears = years.filter((y) => y.is_published).sort((a, b) => b.year - a.year);
  if (publishedYears.length === 0) return null;

  const currentCalYear = currentDate.getFullYear();
  const currentYearObj = publishedYears.find((y) => y.year === currentCalYear);

  if (currentYearObj) return currentYearObj;
  return publishedYears[0];
}
