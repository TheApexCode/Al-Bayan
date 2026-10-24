import { LocationInfo, CalculationMethod, JuristicMethod, PrayerTimes } from '../types';

export const CITY_PRESETS: LocationInfo[] = [
  { city: 'Karachi', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi' },
  { city: 'Lahore', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587, timezone: 'Asia/Karachi' },
  { city: 'Islamabad', country: 'Pakistan', latitude: 33.6844, longitude: 73.0479, timezone: 'Asia/Karachi' },
  { city: 'Makkah', country: 'Saudi Arabia', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
  { city: 'Madinah', country: 'Saudi Arabia', latitude: 24.5247, longitude: 39.5692, timezone: 'Asia/Riyadh' },
  { city: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { city: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  { city: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { city: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
  { city: 'Kuala Lumpur', country: 'Malaysia', latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { city: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { city: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { city: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' }
];

// Calculation Method Parameters
interface MethodParams {
  fajrAngle: number;
  ishaAngle?: number;
  ishaIntervalMinutes?: number;
}

const METHOD_PARAMS: Record<CalculationMethod, MethodParams> = {
  Karachi: { fajrAngle: 18, ishaAngle: 18 },
  MWL: { fajrAngle: 18, ishaAngle: 17 },
  ISNA: { fajrAngle: 15, ishaAngle: 15 },
  Makkah: { fajrAngle: 18.5, ishaIntervalMinutes: 90 },
  Egypt: { fajrAngle: 19.5, ishaAngle: 17.5 },
  Tehran: { fajrAngle: 17.7, ishaAngle: 14 },
  Gulf: { fajrAngle: 19.5, ishaIntervalMinutes: 90 }
};

// Trigonometric Helpers in Degrees
const d2r = (d: number) => (d * Math.PI) / 180.0;
const r2d = (r: number) => (r * 180.0) / Math.PI;
const sinD = (d: number) => Math.sin(d2r(d));
const cosD = (d: number) => Math.cos(d2r(d));
const tanD = (d: number) => Math.tan(d2r(d));
const asinD = (x: number) => r2d(Math.asin(Math.max(-1, Math.min(1, x))));
const acosD = (x: number) => r2d(Math.acos(Math.max(-1, Math.min(1, x))));
const atanD = (x: number) => r2d(Math.atan(x));

// Julian Day
function getJulianDay(date: Date): number {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
}

// Solar Coordinates
function getSolarCoordinates(jd: number) {
  const d = jd - 2451545.0;
  const g = 357.529 + 0.98560028 * d;
  const q = 280.459 + 0.98564736 * d;
  const l = q + 1.915 * sinD(g) + 0.02 * sinD(2 * g);
  const e = 23.439 - 0.00000036 * d;

  const ra = r2d(Math.atan2(cosD(e) * sinD(l), cosD(l))) / 15.0;
  const decl = asinD(sinD(e) * sinD(l));
  const eqt = (q / 15.0 - (ra < 0 ? ra + 24 : ra > 24 ? ra - 24 : ra)) * 60.0;

  return { declination: decl, equationOfTime: eqt };
}

// Convert fractional hours to local formatted time
function formatHoursToTime(hours: number, baseDate: Date): { timeString: string; dateObj: Date } {
  let h = hours % 24;
  if (h < 0) h += 24;

  const totalMinutes = Math.round(h * 60);
  const hh = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;

  const dateObj = new Date(baseDate);
  dateObj.setHours(hh, mm, 0, 0);

  const period = hh >= 12 ? 'PM' : 'AM';
  const displayH = hh % 12 === 0 ? 12 : hh % 12;
  const displayM = mm.toString().padStart(2, '0');

  return {
    timeString: `${displayH}:${displayM} ${period}`,
    dateObj
  };
}

export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  method: CalculationMethod = 'Karachi',
  juristic: JuristicMethod = 'Hanafi'
): PrayerTimes {
  const jd = getJulianDay(date);
  const { declination, equationOfTime } = getSolarCoordinates(jd);

  // Timezone offset in hours
  const tzOffset = -date.getTimezoneOffset() / 60;

  // Solar Noon in hours
  const solarNoon = 12 + tzOffset - longitude / 15.0 - equationOfTime / 60.0;

  // Sunrise and Sunset angle: -0.8333 degrees for atmospheric refraction
  const sunAngle = -0.8333;
  const cosH0 = (sinD(sunAngle) - sinD(latitude) * sinD(declination)) / (cosD(latitude) * cosD(declination));
  const h0 = acosD(Math.max(-1, Math.min(1, cosH0))) / 15.0;

  const sunriseHour = solarNoon - h0;
  const sunsetHour = solarNoon + h0;

  // Fajr
  const mParams = METHOD_PARAMS[method] || METHOD_PARAMS.Karachi;
  const cosHf = (-sinD(mParams.fajrAngle) - sinD(latitude) * sinD(declination)) / (cosD(latitude) * cosD(declination));
  const hf = acosD(Math.max(-1, Math.min(1, cosHf))) / 15.0;
  const fajrHour = solarNoon - hf;

  // Dhuhr: solar noon plus a few minutes buffer
  const dhuhrHour = solarNoon + 2 / 60.0;

  // Asr
  const shadowMultiplier = juristic === 'Hanafi' ? 2 : 1;
  const asrAngle = -atanD(1 / (shadowMultiplier + tanD(Math.abs(latitude - declination))));
  const cosHa = (sinD(asrAngle) - sinD(latitude) * sinD(declination)) / (cosD(latitude) * cosD(declination));
  const ha = acosD(Math.max(-1, Math.min(1, cosHa))) / 15.0;
  const asrHour = solarNoon + ha;

  // Maghrib: sunset plus a tiny buffer
  const maghribHour = sunsetHour + 2 / 60.0;

  // Isha
  let ishaHour: number;
  if (mParams.ishaIntervalMinutes) {
    ishaHour = maghribHour + mParams.ishaIntervalMinutes / 60.0;
  } else {
    const ishaAngle = mParams.ishaAngle || 18;
    const cosHi = (-sinD(ishaAngle) - sinD(latitude) * sinD(declination)) / (cosD(latitude) * cosD(declination));
    const hi = acosD(Math.max(-1, Math.min(1, cosHi))) / 15.0;
    ishaHour = solarNoon + hi;
  }

  const fajrFmt = formatHoursToTime(fajrHour, date);
  const sunriseFmt = formatHoursToTime(sunriseHour, date);
  const dhuhrFmt = formatHoursToTime(dhuhrHour, date);
  const asrFmt = formatHoursToTime(asrHour, date);
  const maghribFmt = formatHoursToTime(maghribHour, date);
  const ishaFmt = formatHoursToTime(ishaHour, date);

  return {
    fajr: fajrFmt.timeString,
    sunrise: sunriseFmt.timeString,
    dhuhr: dhuhrFmt.timeString,
    asr: asrFmt.timeString,
    maghrib: maghribFmt.timeString,
    isha: ishaFmt.timeString,
    fajrDate: fajrFmt.dateObj,
    sunriseDate: sunriseFmt.dateObj,
    dhuhrDate: dhuhrFmt.dateObj,
    asrDate: asrFmt.dateObj,
    maghribDate: maghribFmt.dateObj,
    ishaDate: ishaFmt.dateObj
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

export function getNextPrayerInfo(times: PrayerTimes, now: Date = new Date()): NextPrayerInfo {
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
      const prevItem = i > 0 ? schedule[i - 1] : { name: 'Isha (Yesterday)', date: new Date(times.ishaDate.getTime() - 24 * 3600 * 1000) };
      const diffSec = Math.max(0, Math.floor((item.date.getTime() - nowMs) / 1000));
      const totalWindowSec = Math.max(1, Math.floor((item.date.getTime() - prevItem.date.getTime()) / 1000));
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
  const tomorrowFajrDate = new Date(times.fajrDate.getTime() + 24 * 3600 * 1000);
  const diffSec = Math.max(0, Math.floor((tomorrowFajrDate.getTime() - nowMs) / 1000));
  const totalWindowSec = Math.max(1, Math.floor((tomorrowFajrDate.getTime() - times.ishaDate.getTime()) / 1000));
  const elapsedSec = Math.max(0, Math.floor((nowMs - times.ishaDate.getTime()) / 1000));
  const progress = Math.min(100, Math.max(0, (elapsedSec / totalWindowSec) * 100));

  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;

  return {
    currentPrayer: 'Isha',
    nextPrayer: 'Fajr',
    nextPrayerTime: times.fajr,
    nextPrayerDate: tomorrowFajrDate,
    secondsRemaining: diffSec,
    timeRemainingFormatted: `${h > 0 ? `${h}h ` : ''}${m}m ${s.toString().padStart(2, '0')}s`,
    progressPercent: progress
  };
}

// Gentle Web Audio tone for adhan chime
export function playGentleChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
