import React from 'react';
import { TabType } from '../types';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleDarkMode
}) => {
  const navItems: { id: TabType; label: string }[] = [
    { id: 'prayer', label: 'Prayer Times' },
    { id: 'quran', label: 'Quran Reader' },
    { id: 'bayan', label: 'Bayan-ul-Quran' },
    { id: 'qibla-calendar', label: 'Qibla & Calendar' },
    { id: 'zakat', label: 'Zakat Calculator' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md transition-colors">
      {/* Top Dedication & Credit Ribbon */}
      <div className="w-full bg-emerald-900 dark:bg-stone-900 text-emerald-100 dark:text-stone-300 py-1.5 px-3 sm:px-6 text-center text-[11px] sm:text-xs border-b border-emerald-800/60 dark:border-stone-800 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 leading-normal">
          <div className="flex items-center gap-1.5 text-center sm:text-left">
            <span>
              For Esal e Sawab of our beloved brother <strong className="text-white font-semibold">Shaheed Zeeshan Afsar</strong> and our marhoom father <strong className="text-white font-semibold">Muhammad Afsar</strong>
            </span>
          </div>
          <div className="text-emerald-300 dark:text-emerald-400 text-[10px] sm:text-xs font-medium whitespace-nowrap">
            Designed and Developed by Farhan Afsar
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-2.5 sm:py-3.5">
        {/* Zone 1: Brand Wordmark with Subtitle Credits */}
        <div className="flex flex-col items-start text-left shrink-0">
          <button
            onClick={() => setActiveTab('prayer')}
            className="text-xl sm:text-2xl font-cinzel font-semibold tracking-wider text-emerald-900 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <span>AL-BAYAN</span>
          </button>
          <span className="text-[10px] sm:text-[11px] text-stone-600 dark:text-stone-300 font-medium leading-tight max-w-[260px] sm:max-w-md hidden sm:block">
            For Esal e Sawab of our beloved brother Shaheed Zeeshan Afsar &amp; our marhoom father Muhammad Afsar
          </span>
          <span className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 font-medium hidden sm:block">
            Designed and Developed by Farhan Afsar
          </span>
        </div>

        {/* Zone 2: 5 Concise Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-stone-300">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 relative py-1 text-sm ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action (Dark/Light Mode Toggle) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Dark and Light Mode"
            className="p-2 sm:px-3 sm:py-2 min-h-[42px] min-w-[42px] rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-2 text-xs font-medium active:scale-95"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Scrollable Navigation Bar */}
      <div className="lg:hidden border-t border-stone-200/70 dark:border-stone-800/70 overflow-x-auto no-scrollbar px-3 py-2 flex items-center gap-1.5 bg-stone-100/70 dark:bg-stone-900/80">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] flex items-center ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800/70'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
