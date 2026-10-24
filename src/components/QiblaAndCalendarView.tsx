import React, { useState, useEffect } from 'react';
import { LocationInfo } from '../types';
import {
  calculateQiblaBearing,
  calculateDistanceToKaaba,
  getCardinalDirection,
  KAABA_COORDINATES
} from '../utils/qibla';
import {
  getHijriDate,
  HIJRI_MONTHS,
  ISLAMIC_EVENTS,
  getEventForHijriDay
} from '../utils/hijriCalendar';
import {
  Compass,
  Calendar,
  RotateCw,
  Navigation,
  CheckCircle2,
  CalendarDays,
  Clock,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

interface QiblaAndCalendarViewProps {
  location: LocationInfo;
  setLocation: (loc: LocationInfo) => void;
}

export const QiblaAndCalendarView: React.FC<QiblaAndCalendarViewProps> = ({
  location,
  setLocation
}) => {
  const [activeTab, setActiveTab] = useState<'qibla' | 'calendar' | 'converter'>('qibla');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [moonAdjustment, setMoonAdjustment] = useState<number>(0);

  // Date Converter State
  const [converterInputDate, setConverterInputDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [convertedHijri, setConvertedHijri] = useState(getHijriDate(new Date()));

  // Calculate Qibla bearing & distance
  const qiblaBearing = calculateQiblaBearing(location.latitude, location.longitude);
  const distanceKm = calculateDistanceToKaaba(location.latitude, location.longitude);
  const distanceMiles = Math.round(distanceKm * 0.621371);
  const cardinal = getCardinalDirection(qiblaBearing);

  // Compass difference
  const diffAngle = ((qiblaBearing - deviceHeading + 540) % 360) - 180;
  const isAligned = Math.abs(diffAngle) <= 4;

  // Listen for device orientation on mobile
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading for iOS, alpha for Android
      const heading = (e as any).webkitCompassHeading || (e.alpha ? 360 - e.alpha : null);
      if (heading !== null && !isNaN(heading)) {
        setDeviceHeading(Math.round(heading));
        setHasCompassSensor(true);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  // Update converted date when input changes
  useEffect(() => {
    const d = new Date(converterInputDate);
    if (!isNaN(d.getTime())) {
      setConvertedHijri(getHijriDate(d, moonAdjustment));
    }
  }, [converterInputDate, moonAdjustment]);

  const currentHijri = getHijriDate(currentDate, moonAdjustment);

  // Month days generator for calendar
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Toggle Switch */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white">
            {activeTab === 'qibla' ? 'Qibla Direction & Compass' : activeTab === 'calendar' ? 'Islamic (Hijri) Calendar' : 'Hijri & Gregorian Converter'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {location.city}, {location.country} ({location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E)
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
          <button
            onClick={() => setActiveTab('qibla')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'qibla'
                ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Qibla Compass</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'calendar'
                ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Islamic Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('converter')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'converter'
                ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Date Converter</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: QIBLA COMPASS */}
      {activeTab === 'qibla' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Compass Visual Representation */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-10 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Outer Dial Circle with Degree Ticks */}
              <div
                className="absolute inset-0 rounded-full border-4 border-stone-200 dark:border-stone-800 transition-transform duration-300"
                style={{ transform: `rotate(${-deviceHeading}deg)` }}
              >
                {/* Cardinal Points */}
                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-red-500">N</span>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-stone-500">S</span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">E</span>
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">W</span>

                {/* Sub-cardinal markers */}
                <div className="absolute inset-3 rounded-full border border-dashed border-stone-200 dark:border-stone-800/80" />
              </div>

              {/* Kaaba Direction Needle */}
              <div
                className="absolute w-full h-full flex flex-col items-center justify-start pointer-events-none transition-transform duration-300"
                style={{ transform: `rotate(${qiblaBearing - deviceHeading}deg)` }}
              >
                {/* Kaaba Icon & Indicator at bearing tip */}
                <div className="flex flex-col items-center -mt-3 animate-pulse">
                  <div className="w-6 h-6 rounded-md bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-[10px] text-white dark:text-stone-900 font-bold border border-amber-400 shadow-md">
                    🕋
                  </div>
                  <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                </div>
              </div>

              {/* Device Heading Center Dial */}
              <div className="z-10 flex flex-col items-center justify-center w-28 h-28 rounded-full bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 shadow-inner text-center">
                <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-stone-900 dark:text-stone-100">
                  {qiblaBearing}°
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {cardinal}
                </span>
              </div>
            </div>

            {/* Alignment Banner */}
            <div className="mt-8 text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium">
                {isAligned ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Aligned with the Kaaba!
                  </span>
                ) : (
                  <span className="text-stone-500 dark:text-stone-400">
                    Rotate until your heading aligns with {qiblaBearing}°
                  </span>
                )}
              </div>

              {/* Manual heading slider for desktop users */}
              <div className="pt-4 max-w-xs mx-auto space-y-1">
                <div className="flex justify-between text-[11px] text-stone-500">
                  <span>Simulate Device Heading:</span>
                  <span className="font-mono">{deviceHeading}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={deviceHeading}
                  onChange={(e) => setDeviceHeading(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1"
                />
              </div>
            </div>
          </div>

          {/* Qibla Details & Facts Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-xs">
              <h2 className="text-base font-semibold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-3">
                Qibla Calculation Parameters
              </h2>

              <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300">
                <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                  <span className="text-stone-400">Target:</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Al-Kaaba al-Musharrafa, Makkah</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                  <span className="text-stone-400">Kaaba Coordinates:</span>
                  <span className="font-mono text-stone-800 dark:text-stone-200">{KAABA_COORDINATES.latitude}° N, {KAABA_COORDINATES.longitude}° E</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                  <span className="text-stone-400">User Location:</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">{location.city}, {location.country}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                  <span className="text-stone-400">True Qibla Bearing:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{qiblaBearing}° from True North</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                  <span className="text-stone-400">Great-Circle Distance:</span>
                  <span className="font-mono text-stone-800 dark:text-stone-200">{distanceKm.toLocaleString()} km ({distanceMiles.toLocaleString()} miles)</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-stone-400">Compass Sensor:</span>
                  <span>{hasCompassSensor ? 'Active (Hardware)' : 'Simulated / Gyro fallback'}</span>
                </div>
              </div>
            </div>

            {/* Quranic Verse on the Qibla */}
            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 space-y-2">
              <p dir="rtl" className="font-arabic text-base sm:text-lg text-right text-stone-800 dark:text-stone-200 leading-loose">
                فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ ۚ وَحَيْثُ مَا كُنتُمْ فَوَلُّوا وُجُوهَكُمْ شَطْرَهُ
              </p>
              <p className="font-urdu text-right text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                "پس اپنا رخ مسجدِ حرام (کعبہ) کی طرف موڑ لیجیے، اور تم جہاں کہیں بھی ہو اپنا رخ اسی کی طرف کیا کرو۔" (سورۃ البقرۃ: 144)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ISLAMIC CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Header Ribbon with Moon Adjustment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Current Hijri Era
              </span>
              <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
                {currentHijri.formatted}
              </h2>
              <p className="text-xs text-stone-500 font-arabic text-lg">
                {currentHijri.day} {currentHijri.monthNameAr} {currentHijri.year} هـ
              </p>
            </div>

            {/* Moon Sighting Adjustment Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 whitespace-nowrap">Moon Adjustment:</span>
              <select
                value={moonAdjustment}
                onChange={(e) => setMoonAdjustment(Number(e.target.value))}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs font-medium"
              >
                <option value={-2}>-2 Days</option>
                <option value={-1}>-1 Day</option>
                <option value={0}>Standard (0)</option>
                <option value={1}>+1 Day</option>
                <option value={2}>+2 Days</option>
              </select>
            </div>
          </div>

          {/* Calendar Month Grid */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900 dark:text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <span className="text-xs text-stone-400">
                Umm al-Qura standard alignment
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-2 font-semibold text-stone-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}

              {/* Blank days before start of month */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} className="p-2 min-h-16 rounded-lg bg-stone-50/40 dark:bg-stone-800/20" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateObj = new Date(year, month, dayNum);
                const hDate = getHijriDate(dateObj, moonAdjustment);
                const isToday = dayNum === currentDate.getDate();
                const event = getEventForHijriDay(hDate.day, hDate.month);

                return (
                  <div
                    key={dayNum}
                    className={`p-2 min-h-16 sm:min-h-20 rounded-lg border flex flex-col justify-between text-left transition-colors ${
                      isToday
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 font-semibold text-emerald-950 dark:text-emerald-200'
                        : event
                        ? 'border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20'
                        : 'border-stone-100 dark:border-stone-800/80 bg-white dark:bg-stone-900 hover:border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{dayNum}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{hDate.day}</span>
                    </div>

                    {event && (
                      <span className="text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate" title={event.title}>
                        {event.title}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Major Islamic Events List */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-semibold text-stone-900 dark:text-white">
              Key Islamic Events & Blessed Occasions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ISLAMIC_EVENTS.map((event, idx) => {
                const mInfo = HIJRI_MONTHS[event.hijriMonth - 1];
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400">
                        {event.hijriDay} {mInfo.nameEn}
                      </span>
                      <span className="font-urdu text-sm text-stone-700 dark:text-stone-300">
                        {event.titleUrdu}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {event.title}
                    </h4>

                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: DATE CONVERTER */}
      {activeTab === 'converter' && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
              Gregorian to Hijri Date Converter
            </h2>
            <p className="text-xs text-stone-500">
              Convert any historical or future date into the Islamic lunar calendar
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Select Gregorian Date
              </label>
              <input
                type="date"
                value={converterInputDate}
                onChange={(e) => setConverterInputDate(e.target.value)}
                className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm font-mono focus:outline-emerald-600"
              />
            </div>

            {/* Result Box */}
            <div className="p-6 rounded-xl border border-emerald-600/30 bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-2">
              <span className="text-xs uppercase font-semibold tracking-wider text-emerald-700 dark:text-emerald-400">
                Converted Islamic Date
              </span>

              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white">
                {convertedHijri.formatted}
              </h3>

              <p className="font-arabic text-2xl text-emerald-800 dark:text-emerald-300">
                {convertedHijri.day} {convertedHijri.monthNameAr} {convertedHijri.year} هـ
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
