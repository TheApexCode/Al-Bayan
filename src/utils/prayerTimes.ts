import {
  Coordinates,
  CalculationMethod as AdhanCalculationMethod,
  Madhab,
  PrayerTimes as AdhanPrayerTimes
} from 'adhan';
import { LocationInfo, CalculationMethod, JuristicMethod, PrayerTimes } from '../types';

export const CITY_PRESETS: LocationInfo[] = [
  // Pakistan
  { city: 'Karachi', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi' },
  { city: 'Lahore', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587, timezone: 'Asia/Karachi' },
  { city: 'Islamabad', country: 'Pakistan', latitude: 33.6844, longitude: 73.0479, timezone: 'Asia/Karachi' },
  { city: 'Rawalpindi', country: 'Pakistan', latitude: 33.5651, longitude: 73.0169, timezone: 'Asia/Karachi' },
  { city: 'Peshawar', country: 'Pakistan', latitude: 34.0151, longitude: 71.5249, timezone: 'Asia/Karachi' },
  { city: 'Quetta', country: 'Pakistan', latitude: 30.1798, longitude: 66.9750, timezone: 'Asia/Karachi' },
  { city: 'Multan', country: 'Pakistan', latitude: 30.1575, longitude: 71.5249, timezone: 'Asia/Karachi' },
  { city: 'Faisalabad', country: 'Pakistan', latitude: 31.4504, longitude: 73.1350, timezone: 'Asia/Karachi' },
  { city: 'Sialkot', country: 'Pakistan', latitude: 32.4945, longitude: 74.5229, timezone: 'Asia/Karachi' },
  { city: 'Hyderabad', country: 'Pakistan', latitude: 25.3960, longitude: 68.3578, timezone: 'Asia/Karachi' },
  // Middle East & Holy Sites
  { city: 'Makkah', country: 'Saudi Arabia', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
  { city: 'Madinah', country: 'Saudi Arabia', latitude: 24.5247, longitude: 39.5692, timezone: 'Asia/Riyadh' },
  { city: 'Riyadh', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh' },
  { city: 'Jeddah', country: 'Saudi Arabia', latitude: 21.5433, longitude: 39.1728, timezone: 'Asia/Riyadh' },
  { city: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { city: 'Abu Dhabi', country: 'UAE', latitude: 24.4539, longitude: 54.3773, timezone: 'Asia/Dubai' },
  { city: 'Doha', country: 'Qatar', latitude: 25.2854, longitude: 51.5310, timezone: 'Asia/Qatar' },
  { city: 'Kuwait City', country: 'Kuwait', latitude: 29.3759, longitude: 47.9774, timezone: 'Asia/Kuwait' },
  { city: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  { city: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  // UK & Europe
  { city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { city: 'Birmingham', country: 'United Kingdom', latitude: 52.4862, longitude: -1.8904, timezone: 'Europe/London' },
  { city: 'Manchester', country: 'United Kingdom', latitude: 53.4808, longitude: -2.2426, timezone: 'Europe/London' },
  // Americas
  { city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { city: 'Chicago', country: 'United States', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago' },
  { city: 'Houston', country: 'United States', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago' },
  { city: 'Los Angeles', country: 'United States', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
  { city: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
  // Asia & Oceania
  { city: 'Kuala Lumpur', country: 'Malaysia', latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { city: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { city: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { city: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata' },
  { city: 'Dhaka', country: 'Bangladesh', latitude: 23.8103, longitude: 90.4125, timezone: 'Asia/Dhaka' },
  { city: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' }
];

function getCalculationParameters(method: CalculationMethod) {
  switch (method) {
    case 'Karachi':
      return AdhanCalculationMethod.Karachi();
    case 'MWL':
      return AdhanCalculationMethod.MuslimWorldLeague();
    case 'ISNA':
      return AdhanCalculationMethod.NorthAmerica();
    case 'Makkah':
      return AdhanCalculationMethod.UmmAlQura();
    case 'Egypt':
      return AdhanCalculationMethod.Egyptian();
    case 'Tehran':
      return AdhanCalculationMethod.Tehran();
    case 'Gulf':
      return AdhanCalculationMethod.Dubai();
    default:
      return AdhanCalculationMethod.Karachi();
  }
}

/**
 * High-precision, astronomically accurate prayer times calculation using standard Adhan library.
 * Fully accounts for location timezone, exact solar transit, and madhab adjustments.
 */
export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  method: CalculationMethod = 'Karachi',
  juristic: JuristicMethod = 'Hanafi',
  timezone?: string
): PrayerTimes {
  const targetTz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi';

  // Extract year, month, and day in target location timezone to ensure calculation for local calendar day
  let year: number;
  let month: number;
  let day: number;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    year = parseInt(parts.find((p) => p.type === 'year')?.value || `${date.getFullYear()}`, 10);
    month = parseInt(parts.find((p) => p.type === 'month')?.value || `${date.getMonth() + 1}`, 10) - 1;
    day = parseInt(parts.find((p) => p.type === 'day')?.value || `${date.getDate()}`, 10);
  } catch {
    year = date.getFullYear();
    month = date.getMonth();
    day = date.getDate();
  }

  // Create date object for adhan calculations
  const calculationDate = new Date(year, month, day, 12, 0, 0);

  const coordinates = new Coordinates(latitude, longitude);
  const parameters = getCalculationParameters(method);
  parameters.madhab = juristic === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const pt = new AdhanPrayerTimes(coordinates, calculationDate, parameters);

  // Format Date object into target timezone formatted time string (e.g., "5:18 AM", "12:17 PM")
  const formatTime = (d: Date): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: targetTz
      }).format(d);
    } catch {
      let h = d.getHours();
      const m = d.getMinutes();
      const period = h >= 12 ? 'PM' : 'AM';
      h = h % 12 === 0 ? 12 : h % 12;
      return `${h}:${m.toString().padStart(2, '0')} ${period}`;
    }
  };

  return {
    fajr: formatTime(pt.fajr),
    sunrise: formatTime(pt.sunrise),
    dhuhr: formatTime(pt.dhuhr),
    asr: formatTime(pt.asr),
    maghrib: formatTime(pt.maghrib),
    isha: formatTime(pt.isha),
    fajrDate: pt.fajr,
    sunriseDate: pt.sunrise,
    dhuhrDate: pt.dhuhr,
    asrDate: pt.asr,
    maghribDate: pt.maghrib,
    ishaDate: pt.isha
  };
}

export interface NextPrayerInfo {
  currentPrayer: string;
  nextPrayer: string;
  nextPrayerTime: string;
  nextPrayerDate: Date;
  secondsRemaining: number;
  timeRemainingFormatted: string;
  progressPercent: number;
}

export function getNextPrayerInfo(
  times: PrayerTimes,
  now: Date = new Date(),
  latitude?: number,
  longitude?: number,
  method: CalculationMethod = 'Karachi',
  juristic: JuristicMethod = 'Hanafi',
  timezone?: string
): NextPrayerInfo {
  const schedule = [
    { name: 'Fajr', date: times.fajrDate, timeStr: times.fajr },
    { name: 'Sunrise', date: times.sunriseDate, timeStr: times.sunrise },
    { name: 'Dhuhr', date: times.dhuhrDate, timeStr: times.dhuhr },
    { name: 'Asr', date: times.asrDate, timeStr: times.asr },
    { name: 'Maghrib', date: times.maghribDate, timeStr: times.maghrib },
    { name: 'Isha', date: times.ishaDate, timeStr: times.isha }
  ];

  const nowMs = now.getTime();

  for (let i = 0; i < schedule.length; i++) {
    const item = schedule[i];
    if (item.date.getTime() > nowMs) {
      const prevItem =
        i > 0
          ? schedule[i - 1]
          : {
              name: 'Isha (Yesterday)',
              date: new Date(times.fajrDate.getTime() - 8 * 3600 * 1000)
            };
      const diffSec = Math.max(0, Math.floor((item.date.getTime() - nowMs) / 1000));
      const totalWindowSec = Math.max(
        1,
        Math.floor((item.date.getTime() - prevItem.date.getTime()) / 1000)
      );
      const elapsedSec = Math.max(0, Math.floor((nowMs - prevItem.date.getTime()) / 1000));
      const progress = Math.min(100, Math.max(0, (elapsedSec / totalWindowSec) * 100));

      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      const formatted = `${h > 0 ? `${h}h ` : ''}${m}m ${s.toString().padStart(2, '0')}s`;

      return {
        currentPrayer: prevItem.name.replace(' (Yesterday)', ''),
        nextPrayer: item.name,
        nextPrayerTime: item.timeStr,
        nextPrayerDate: item.date,
        secondsRemaining: diffSec,
        timeRemainingFormatted: formatted,
        progressPercent: progress
      };
    }
  }

  // If after Isha, next is tomorrow's Fajr
  let tomorrowFajrDate = new Date(times.fajrDate.getTime() + 24 * 3600 * 1000);
  let tomorrowFajrTime = times.fajr;

  if (latitude !== undefined && longitude !== undefined) {
    const tomorrow = new Date(nowMs + 24 * 3600 * 1000);
    const tomorrowTimes = calculatePrayerTimes(
      tomorrow,
      latitude,
      longitude,
      method,
      juristic,
      timezone
    );
    tomorrowFajrDate = tomorrowTimes.fajrDate;
    tomorrowFajrTime = tomorrowTimes.fajr;
  }

  const diffSec = Math.max(0, Math.floor((tomorrowFajrDate.getTime() - nowMs) / 1000));
  const totalWindowSec = Math.max(
    1,
    Math.floor((tomorrowFajrDate.getTime() - times.ishaDate.getTime()) / 1000)
  );
  const elapsedSec = Math.max(0, Math.floor((nowMs - times.ishaDate.getTime()) / 1000));
  const progress = Math.min(100, Math.max(0, (elapsedSec / totalWindowSec) * 100));

  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;

  return {
    currentPrayer: 'Isha',
    nextPrayer: 'Fajr',
    nextPrayerTime: tomorrowFajrTime,
    nextPrayerDate: tomorrowFajrDate,
    secondsRemaining: diffSec,
    timeRemainingFormatted: `${h > 0 ? `${h}h ` : ''}${m}m ${s.toString().padStart(2, '0')}s`,
    progressPercent: progress
  };
}

// Gentle Web Audio tone for adhan chime fallback
export function playGentleChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [440, 554.37, 659.25, 880]; // A major serene chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1 + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5 + idx * 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.15);
      osc.stop(ctx.currentTime + 3.0 + idx * 0.3);
    });
  } catch (e) {
    console.error('Audio chime error:', e);
  }
}
