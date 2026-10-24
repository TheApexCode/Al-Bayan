import React, { useState, useEffect } from 'react';
import { TabType, LocationInfo, CalculationMethod, JuristicMethod } from './types';
import { CITY_PRESETS } from './utils/prayerTimes';
import { Header } from './components/Header';
import { PrayerTimesView } from './components/PrayerTimesView';
import { QuranReaderView } from './components/QuranReaderView';
import { BayanUlQuranView } from './components/BayanUlQuranView';
import { QiblaAndCalendarView } from './components/QiblaAndCalendarView';
import { ZakatCalculatorView } from './components/ZakatCalculatorView';
import { ExternalLink, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('prayer');
  const [selectedSurahForBayan, setSelectedSurahForBayan] = useState<number>(1);

  // Dark Mode State with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('al_bayan_dark_mode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply dark class and data-theme to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('al_bayan_dark_mode', JSON.stringify(isDarkMode));
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Location State
  const [location, setLocation] = useState<LocationInfo>(() => {
    try {
      const saved = localStorage.getItem('al_bayan_location');
      return saved ? JSON.parse(saved) : CITY_PRESETS[0]; // Karachi default
    } catch {
      return CITY_PRESETS[0];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('al_bayan_location', JSON.stringify(location));
    } catch (e) {
      console.warn('Could not save location:', e);
    }
  }, [location]);

  // Prayer Calculation Method State
  const [method, setMethod] = useState<CalculationMethod>('Karachi');
  const [juristic, setJuristic] = useState<JuristicMethod>('Hanafi');

  // Cross-Navigation Handler from Quran Reader to Bayan-ul-Quran
  const handleNavigateToBayan = (surahNum: number) => {
    setSelectedSurahForBayan(surahNum);
    setActiveTab('bayan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Top Header conforming to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'prayer' && (
          <PrayerTimesView
            location={location}
            setLocation={setLocation}
            method={method}
            setMethod={setMethod}
            juristic={juristic}
            setJuristic={setJuristic}
          />
        )}

        {activeTab === 'quran' && (
          <QuranReaderView
            initialSurahNumber={selectedSurahForBayan}
            onNavigateToBayan={handleNavigateToBayan}
          />
        )}

        {activeTab === 'bayan' && (
          <BayanUlQuranView
            initialSurahNumber={selectedSurahForBayan}
          />
        )}

        {activeTab === 'qibla-calendar' && (
          <QiblaAndCalendarView
            location={location}
            setLocation={setLocation}
          />
        )}

        {activeTab === 'zakat' && (
          <ZakatCalculatorView />
        )}
      </main>

      {/* Minimalist Editorial Footer (No External Links) */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/60 py-6 px-4 sm:px-6 mt-8 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <div className="flex items-center gap-2">
              <span className="font-cinzel font-semibold tracking-wider text-stone-700 dark:text-stone-300">
                AL-BAYAN
              </span>
              <span>·</span>
              <span>Dr. Israr Ahmed's Bayan-ul-Quran &amp; Islamic Companion</span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              For Esal e Sawab of our beloved brother <strong className="font-semibold text-stone-800 dark:text-stone-200">Shaheed Zeeshan Afsar</strong> and our marhoom father <strong className="font-semibold text-stone-800 dark:text-stone-200">Muhammad Afsar</strong>
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              Designed and Developed by Farhan Afsar
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('bayan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Tafseer Reader
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setActiveTab('prayer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Adan Alarms
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setActiveTab('zakat');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Zakat Calculator
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
