import React, { useState, useEffect, useRef } from 'react';
import { LocationInfo, CalculationMethod, JuristicMethod, PrayerAlarmSettings } from '../types';
import {
  calculatePrayerTimes,
  getNextPrayerInfo,
  CITY_PRESETS,
  NextPrayerInfo
} from '../utils/prayerTimes';
import { getHijriDate } from '../utils/hijriCalendar';
import {
  MapPin,
  Clock,
  Compass,
  Volume2,
  VolumeX,
  Sliders,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Navigation,
  Bell,
  BellRing,
  BellOff,
  Play,
  Square,
  Sparkles,
  Radio
} from 'lucide-react';

interface PrayerTimesViewProps {
  location: LocationInfo;
  setLocation: (loc: LocationInfo) => void;
  method: CalculationMethod;
  setMethod: (m: CalculationMethod) => void;
  juristic: JuristicMethod;
  setJuristic: (j: JuristicMethod) => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  location,
  setLocation,
  method,
  setMethod,
  juristic,
  setJuristic
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showMonthlySchedule, setShowMonthlySchedule] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  // Adan Alarm Settings
  const [alarms, setAlarms] = useState<PrayerAlarmSettings>(() => {
    try {
      const saved = localStorage.getItem('al_bayan_adan_alarms');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      volume: 0.9
    };
  });

  // Complete Adan Audio State
  const [isAdanPlaying, setIsAdanPlaying] = useState<boolean>(false);
  const [adanProgress, setAdanProgress] = useState<number>(0);
  const [adanDuration, setAdanDuration] = useState<number>(183); // 3:03 approx
  const [activeAlarmPrayer, setActiveAlarmPrayer] = useState<string | null>(null);
  const adanAudioRef = useRef<HTMLAudioElement | null>(null);

  // Track prayers triggered today to prevent repeated triggers
  const triggeredTodayRef = useRef<Set<string>>(new Set());

  // Save alarms to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('al_bayan_adan_alarms', JSON.stringify(alarms));
    } catch (e) {
      console.warn('Could not save alarm settings:', e);
    }
  }, [alarms]);

  // Update clock every second & check for Adan alarm triggers
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check alarms if master switch is enabled
      if (alarms.enabled) {
        const times = calculatePrayerTimes(
          now,
          location.latitude,
          location.longitude,
          method,
          juristic
        );

        const prayersToCheck: { name: string; key: keyof PrayerAlarmSettings; date: Date }[] = [
          { name: 'Fajr', key: 'fajr', date: times.fajrDate },
          { name: 'Dhuhr', key: 'dhuhr', date: times.dhuhrDate },
          { name: 'Asr', key: 'asr', date: times.asrDate },
          { name: 'Maghrib', key: 'maghrib', date: times.maghribDate },
          { name: 'Isha', key: 'isha', date: times.ishaDate }
        ];

        const todayKey = now.toDateString();

        prayersToCheck.forEach((p) => {
          if (alarms[p.key]) {
            const diffMs = now.getTime() - p.date.getTime();
            // Trigger within the first 45 seconds of the prayer time
            const triggerId = `${todayKey}-${p.name}`;
            if (diffMs >= 0 && diffMs < 45000 && !triggeredTodayRef.current.has(triggerId)) {
              triggeredTodayRef.current.add(triggerId);
              triggerAdanAlarm(p.name);
            }
          }
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [alarms, location, method, juristic]);

  // Trigger Complete Adan Audio
  const triggerAdanAlarm = (prayerName: string) => {
    setActiveAlarmPrayer(prayerName);
    playCompleteAdan();

    // Trigger browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Adan is Calling: ${prayerName}`, {
          body: `It is now time for ${prayerName} prayer in ${location.city}.`,
          icon: '/favicon.ico'
        });
      } catch (err) {
        console.warn('Notification error:', err);
      }
    }
  };

  const playCompleteAdan = () => {
    if (!adanAudioRef.current) {
      adanAudioRef.current = new Audio('/audio/adhan.mp3');
      adanAudioRef.current.onended = () => {
        setIsAdanPlaying(false);
        setActiveAlarmPrayer(null);
        setAdanProgress(0);
      };
      adanAudioRef.current.ontimeupdate = () => {
        if (adanAudioRef.current) {
          setAdanProgress(adanAudioRef.current.currentTime);
          if (adanAudioRef.current.duration) {
            setAdanDuration(adanAudioRef.current.duration);
          }
        }
      };
      adanAudioRef.current.onerror = () => {
        // Fallback to OGG version if mp3 fails
        if (adanAudioRef.current) {
          adanAudioRef.current.src = '/audio/adhan.ogg';
          adanAudioRef.current.play().catch((e) => console.warn('Adan fallback failed:', e));
        }
      };
    } else {
      adanAudioRef.current.src = '/audio/adhan.mp3';
    }

    adanAudioRef.current.volume = alarms.volume;
    adanAudioRef.current
      .play()
      .then(() => {
        setIsAdanPlaying(true);
      })
      .catch((err) => {
        console.warn('Adan audio play prevented:', err);
      });
  };

  const stopCompleteAdan = () => {
    if (adanAudioRef.current) {
      adanAudioRef.current.pause();
      adanAudioRef.current.currentTime = 0;
    }
    setIsAdanPlaying(false);
    setActiveAlarmPrayer(null);
    setAdanProgress(0);
  };

  const toggleAlarmForPrayer = (prayerKey: keyof PrayerAlarmSettings) => {
    setAlarms((prev) => ({
      ...prev,
      [prayerKey]: !prev[prayerKey]
    }));
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  const prayerTimes = calculatePrayerTimes(
    currentTime,
    location.latitude,
    location.longitude,
    method,
    juristic
  );

  const nextInfo: NextPrayerInfo = getNextPrayerInfo(prayerTimes, currentTime);
  const hijriDate = getHijriDate(currentTime);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationStatus('Locating coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setLocation({
          city: 'My Location',
          country: 'Local GPS',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        setLocationStatus('GPS Coordinates acquired successfully.');
        setTimeout(() => setLocationStatus(''), 3000);
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus(`Could not detect location: ${err.message}`);
        setTimeout(() => setLocationStatus(''), 4000);
      },
      { timeout: 8000 }
    );
  };

  const prayersList = [
    {
      id: 'fajr',
      key: 'fajr' as keyof PrayerAlarmSettings,
      name: 'Fajr',
      arabic: 'الفَجْر',
      time: prayerTimes.fajr,
      date: prayerTimes.fajrDate,
      desc: 'Dawn prayer before sunrise',
      canAlarm: true
    },
    {
      id: 'sunrise',
      key: null,
      name: 'Sunrise',
      arabic: 'الشُّرُوق',
      time: prayerTimes.sunrise,
      date: prayerTimes.sunriseDate,
      desc: 'Solar dawn (prohibited prayer time)',
      canAlarm: false
    },
    {
      id: 'dhuhr',
      key: 'dhuhr' as keyof PrayerAlarmSettings,
      name: 'Dhuhr',
      arabic: 'الظُّهْر',
      time: prayerTimes.dhuhr,
      date: prayerTimes.dhuhrDate,
      desc: 'Midday prayer after sun zenith',
      canAlarm: true
    },
    {
      id: 'asr',
      key: 'asr' as keyof PrayerAlarmSettings,
      name: 'Asr',
      arabic: 'العَصْر',
      time: prayerTimes.asr,
      date: prayerTimes.asrDate,
      desc: `Afternoon prayer (${juristic} shadow)`,
      canAlarm: true
    },
    {
      id: 'maghrib',
      key: 'maghrib' as keyof PrayerAlarmSettings,
      name: 'Maghrib',
      arabic: 'المَغْرِب',
      time: prayerTimes.maghrib,
      date: prayerTimes.maghribDate,
      desc: 'Sunset prayer and breaking fast',
      canAlarm: true
    },
    {
      id: 'isha',
      key: 'isha' as keyof PrayerAlarmSettings,
      name: 'Isha',
      arabic: 'العِشَاء',
      time: prayerTimes.isha,
      date: prayerTimes.ishaDate,
      desc: 'Night prayer before sleeping',
      canAlarm: true
    }
  ];

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Active Adan Calling Banner (when alarm triggers) */}
      {isAdanPlaying && (
        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/80 p-5 sm:p-6 shadow-lg animate-pulse transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                <BellRing className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                <span>Allāhu Akbar · Complete Adan is Calling</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white">
                {activeAlarmPrayer ? `${activeAlarmPrayer} Adan` : 'Complete Adan Audio Playing'}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 font-urdu pt-0.5">
                حی علی الصلاۃ · حی علی الفلاح (نماز کی طرف آؤ، کامیابی کی طرف آؤ)
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-xs tabular-nums text-emerald-800 dark:text-emerald-300">
                {formatSeconds(adanProgress)} / {formatSeconds(adanDuration)}
              </span>
              <button
                onClick={stopCompleteAdan}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs flex items-center gap-2 shadow-xs active:scale-95 transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Adan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner: Location, Next Prayer Countdown, & Adan Alarm Bar */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{location.city}, {location.country}</span>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span className="text-stone-500 font-normal lowercase">{location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-semibold text-stone-900 dark:text-white tracking-tight">
              {nextInfo.nextPrayer} in <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">{nextInfo.timeRemainingFormatted}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-stone-500 dark:text-stone-400 pt-1">
              <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span className="font-medium text-stone-700 dark:text-stone-300">{hijriDate.formatted}</span>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span>{method} ({juristic})</span>
            </div>
          </div>

          {/* Quick Action Controls (Mobile Friendly Touch Targets) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Complete Adan Voice Player Button */}
            <button
              onClick={() => {
                if (isAdanPlaying) {
                  stopCompleteAdan();
                } else {
                  playCompleteAdan();
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] text-xs font-medium rounded-xl border transition-all active:scale-95 ${
                isAdanPlaying
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                  : 'border-emerald-700/40 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              }`}
              title="Play or test the complete authentic Adan voice"
            >
              {isAdanPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Adan</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-emerald-700 dark:text-emerald-400" />
                  <span>Play Complete Adan</span>
                </>
              )}
            </button>

            {/* GPS Auto-Detect */}
            <button
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition-colors"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'GPS'}</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            {/* Monthly Timetable */}
            <button
              onClick={() => setShowMonthlySchedule(!showMonthlySchedule)}
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timetable</span>
            </button>
          </div>
        </div>

        {locationStatus && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3">{locationStatus}</p>
        )}

        {/* Progress Bar towards Next Prayer */}
        <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Current: <strong className="text-stone-700 dark:text-stone-300 font-medium">{nextInfo.currentPrayer}</strong></span>
            <span>Target: <strong className="text-stone-700 dark:text-stone-300 font-medium">{nextInfo.nextPrayer} ({nextInfo.nextPrayerTime})</strong></span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${nextInfo.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Adan Alarm Control Ribbon */}
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAlarms((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                alarms.enabled
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                  : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {alarms.enabled ? <BellRing className="w-4 h-4 text-emerald-600" /> : <BellOff className="w-4 h-4 text-stone-400" />}
              <span>{alarms.enabled ? 'Adan Voice Alarms Active' : 'Adan Alarms Paused'}</span>
            </button>
            <span className="text-stone-400 hidden sm:inline">Tap the bell on each prayer card to customize.</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-stone-500">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Volume:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={alarms.volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAlarms((prev) => ({ ...prev, volume: v }));
                  if (adanAudioRef.current) {
                    adanAudioRef.current.volume = v;
                  }
                }}
                className="w-20 accent-emerald-600 h-1.5"
              />
            </div>

            <button
              onClick={requestNotificationPermission}
              className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
            >
              Device Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel Drawer */}
      {showSettings && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900 dark:text-white">Prayer Calculation & Location Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 p-1"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* City Preset Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Select City
              </label>
              <select
                value={location.city}
                onChange={(e) => {
                  const found = CITY_PRESETS.find((c) => c.city === e.target.value);
                  if (found) setLocation(found);
                }}
                className="w-full p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-emerald-600 min-h-[44px]"
              >
                {CITY_PRESETS.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}, {c.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Calculation Method */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Calculation Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as CalculationMethod)}
                className="w-full p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-emerald-600 min-h-[44px]"
              >
                <option value="Karachi">University of Islamic Sciences, Karachi (18°/18°)</option>
                <option value="MWL">Muslim World League (MWL - 18°/17°)</option>
                <option value="ISNA">ISNA (North America - 15°/15°)</option>
                <option value="Makkah">Umm al-Qura University, Makkah</option>
                <option value="Egypt">Egyptian General Authority of Survey</option>
                <option value="Gulf">Gulf Region</option>
                <option value="Tehran">Institute of Geophysics, Tehran</option>
              </select>
            </div>

            {/* Asr Juristic Method */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Asr Juristic Standard
              </label>
              <select
                value={juristic}
                onChange={(e) => setJuristic(e.target.value as JuristicMethod)}
                className="w-full p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-emerald-600 min-h-[44px]"
              >
                <option value="Hanafi">Hanafi (Shadow ratio 2x)</option>
                <option value="Standard">Standard: Shafi'i, Maliki, Hanbali (Shadow ratio 1x)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Prayer Times 6-Card Grid with Dedicated Adan Alarm Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {prayersList.map((prayer) => {
          const isNext = nextInfo.nextPrayer === prayer.name;
          const isCurrent = nextInfo.currentPrayer === prayer.name;
          const isAlarmActive = prayer.canAlarm && prayer.key && alarms[prayer.key] && alarms.enabled;

          return (
            <div
              key={prayer.id}
              className={`relative rounded-xl p-5 border transition-all ${
                isNext
                  ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                  : isCurrent
                  ? 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xs'
                  : 'border-stone-200 dark:border-stone-800/80 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-stone-900 dark:text-white">
                      {prayer.name}
                    </span>
                    {isNext && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Upcoming
                      </span>
                    )}
                    {isCurrent && !isNext && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    {prayer.desc}
                  </p>
                </div>

                <span className="font-arabic text-xl text-stone-400 dark:text-stone-500">
                  {prayer.arabic}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/70 flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-mono tabular-nums font-semibold text-stone-900 dark:text-stone-100">
                  {prayer.time}
                </span>

                {/* Alarm Bell Button for this prayer */}
                {prayer.canAlarm && prayer.key && (
                  <button
                    onClick={() => toggleAlarmForPrayer(prayer.key!)}
                    aria-label={`Toggle Adan alarm for ${prayer.name}`}
                    className={`p-2.5 min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                      isAlarmActive
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                    title={isAlarmActive ? `Adan Alarm ON for ${prayer.name}` : `Set Adan Alarm for ${prayer.name}`}
                  >
                    {isAlarmActive ? <BellRing className="w-4 h-4 fill-current text-emerald-600 dark:text-emerald-400" /> : <BellOff className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Prayer Timetable Modal */}
      {showMonthlySchedule && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
              Monthly Prayer Timetable ({location.city})
            </h3>
            <button
              onClick={() => setShowMonthlySchedule(false)}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 p-1"
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 font-medium">
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3">Fajr</th>
                  <th className="py-2.5 px-3">Sunrise</th>
                  <th className="py-2.5 px-3">Dhuhr</th>
                  <th className="py-2.5 px-3">Asr</th>
                  <th className="py-2.5 px-3">Maghrib</th>
                  <th className="py-2.5 px-3">Isha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono tabular-nums">
                {Array.from({ length: 30 }).map((_, idx) => {
                  const d = new Date(currentTime);
                  d.setDate(idx + 1);
                  const times = calculatePrayerTimes(d, location.latitude, location.longitude, method, juristic);
                  const isToday = d.getDate() === currentTime.getDate();

                  return (
                    <tr
                      key={idx}
                      className={isToday ? 'bg-emerald-50/60 dark:bg-emerald-950/30 font-semibold text-emerald-900 dark:text-emerald-300' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/40'}
                    >
                      <td className="py-2 px-3 font-sans font-medium">{idx + 1}</td>
                      <td className="py-2 px-3">{times.fajr}</td>
                      <td className="py-2 px-3">{times.sunrise}</td>
                      <td className="py-2 px-3">{times.dhuhr}</td>
                      <td className="py-2 px-3">{times.asr}</td>
                      <td className="py-2 px-3">{times.maghrib}</td>
                      <td className="py-2 px-3">{times.isha}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
