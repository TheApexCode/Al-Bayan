import React, { useState, useEffect, useRef } from 'react';
import { SurahMeta, Ayah } from '../types';
import { SURAHS_DATA } from '../data/surahs';
import { fetchSurahVerses } from '../data/sampleAyahs';
import {
  Search,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Bookmark,
  Share2,
  Copy,
  Check,
  BookOpen,
  Headphones,
  Sliders,
  ChevronRight,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';

interface QuranReaderViewProps {
  initialSurahNumber?: number;
  onNavigateToBayan?: (surahNum: number) => void;
}

export const QuranReaderView: React.FC<QuranReaderViewProps> = ({
  initialSurahNumber = 1,
  onNavigateToBayan
}) => {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(initialSurahNumber);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState<boolean>(true);

  // Settings
  const [arabicFontSize, setArabicFontSize] = useState<number>(30);
  const [translationFontSize, setTranslationFontSize] = useState<number>(16);
  const [displayMode, setDisplayMode] = useState<'all' | 'arabic-urdu' | 'arabic-english' | 'arabic-only'>('all');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Bookmarks saved in local storage
  const [bookmarkedVerses, setBookmarkedVerses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('al_bayan_quran_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedSurah: SurahMeta =
    SURAHS_DATA.find((s) => s.number === selectedSurahNumber) || SURAHS_DATA[0];

  // Load verses whenever selected Surah changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAyahs(true);
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      setCurrentPlayingAyah(null);
    }

    fetchSurahVerses(selectedSurahNumber).then((data) => {
      if (isMounted) {
        setAyahs(data);
        setIsLoadingAyahs(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedSurahNumber]);

  // Handle Audio playback end -> auto-advance to next Ayah
  const handleAudioEnded = () => {
    if (currentPlayingAyah !== null) {
      const currentIndex = ayahs.findIndex((a) => a.numberInSurah === currentPlayingAyah);
      if (currentIndex >= 0 && currentIndex < ayahs.length - 1) {
        const nextAyah = ayahs[currentIndex + 1];
        playAyahAudio(nextAyah.numberInSurah, nextAyah.audioUrl);
      } else {
        setIsPlayingAudio(false);
        setCurrentPlayingAyah(null);
      }
    }
  };

  const playAyahAudio = (ayahNum: number, url?: string) => {
    if (!url) return;

    if (currentPlayingAyah === ayahNum && isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'none';
      audioRef.current.onended = handleAudioEnded;
      audioRef.current.onerror = (e) => {
        console.warn('Ayah audio failed to load:', e);
        setIsPlayingAudio(false);
        setCurrentPlayingAyah(null);
      };
    }
    audioRef.current.src = url;

    audioRef.current.playbackRate = playbackSpeed;
    audioRef.current
      .play()
      .then(() => {
        setCurrentPlayingAyah(ayahNum);
        setIsPlayingAudio(true);
      })
      .catch((err) => {
        console.warn('Ayah audio play error:', err);
        setIsPlayingAudio(false);
        setCurrentPlayingAyah(null);
      });
  };

  const toggleBookmark = (key: string) => {
    let updated: string[];
    if (bookmarkedVerses.includes(key)) {
      updated = bookmarkedVerses.filter((k) => k !== key);
    } else {
      updated = [...bookmarkedVerses, key];
    }
    setBookmarkedVerses(updated);
    try {
      localStorage.setItem('al_bayan_quran_bookmarks', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save bookmarks:', e);
    }
  };

  const copyVerse = (ayah: Ayah) => {
    const text = `${ayah.textArabic}\n\nUrdu: ${ayah.textUrdu}\n\nEnglish: ${ayah.textEnglish}\n(Surah ${selectedSurah.transliteration} ${selectedSurah.number}:${ayah.numberInSurah})`;
    navigator.clipboard.writeText(text);
    const key = `${selectedSurah.number}-${ayah.numberInSurah}`;
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filter Surahs based on search query
  const filteredSurahs = SURAHS_DATA.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.number.toString() === q ||
      s.transliteration.toLowerCase().includes(q) ||
      s.nameEnglish.toLowerCase().includes(q) ||
      s.nameUrdu.includes(q) ||
      s.nameArabic.includes(q)
    );
  });

  const popularSurahs = [1, 2, 18, 36, 55, 67, 103, 112, 113, 114];

  return (
    <div className="space-y-6">
      {/* Top Controls & Surah Selection Bar */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Surah Dropdown Selector with Search */}
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search Surah by name or number (e.g. Kahf, 18, البقرة)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-emerald-600"
              />
            </div>

            {searchQuery && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg divide-y divide-stone-100 dark:divide-stone-800">
                {filteredSurahs.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => {
                      setSelectedSurahNumber(s.number);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 text-xs text-stone-400 font-mono">{s.number}.</span>
                      <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{s.transliteration}</span>
                      <span className="text-xs text-stone-500">({s.nameEnglish})</span>
                    </div>
                    <span className="font-arabic text-base text-stone-600 dark:text-stone-400">{s.nameArabic}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Surah Navigation Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSurahNumber}
              onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
              aria-label="Select Surah"
              className="py-2.5 px-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-emerald-600 font-medium"
            >
              {SURAHS_DATA.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.transliteration} ({s.nameArabic}) - {s.versesCount} v.
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
              title="Reading display & font settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Surah Filter Strip */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs text-stone-400 whitespace-nowrap mr-1">Frequent:</span>
          {popularSurahs.map((num) => {
            const meta = SURAHS_DATA.find((s) => s.number === num);
            if (!meta) return null;
            const isSelected = selectedSurahNumber === num;
            return (
              <button
                key={num}
                onClick={() => setSelectedSurahNumber(num)}
                className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-emerald-700 text-white font-medium'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {meta.transliteration}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Drawer (Font size, display modes) */}
      {showSettingsDrawer && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white">Reading & Typography Settings</h3>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Display Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Display Translations
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'Urdu + English' },
                  { id: 'arabic-urdu', label: 'Urdu Only' },
                  { id: 'arabic-english', label: 'English Only' },
                  { id: 'arabic-only', label: 'Arabic Only' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setDisplayMode(mode.id as any)}
                    className={`py-1.5 px-2 text-xs rounded-lg border text-center transition-colors ${
                      displayMode === mode.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium'
                        : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Arabic Font Size */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                  Arabic Font Size
                </span>
                <span className="font-mono text-stone-500">{arabicFontSize}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="46"
                value={arabicFontSize}
                onChange={(e) => setArabicFontSize(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <p className="font-arabic text-center text-stone-800 dark:text-stone-200" style={{ fontSize: `${arabicFontSize}px` }}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>

            {/* Translation Font Size */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                  Translation Size
                </span>
                <span className="font-mono text-stone-500">{translationFontSize}px</span>
              </div>
              <input
                type="range"
                min="13"
                max="24"
                value={translationFontSize}
                onChange={(e) => setTranslationFontSize(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <p className="text-center text-stone-600 dark:text-stone-400 font-urdu" style={{ fontSize: `${translationFontSize}px` }}>
                شروع اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Surah Banner / Header Card */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-linear-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 p-6 sm:p-8 text-center space-y-3">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <button
            onClick={() => setSelectedSurahNumber(Math.max(1, selectedSurahNumber - 1))}
            disabled={selectedSurahNumber <= 1}
            className="flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous Surah</span>
          </button>

          <div className="flex items-center gap-2">
            <span>Surah {selectedSurah.number} of 114</span>
            <span>·</span>
            <span>Juz {selectedSurah.juzNumber}</span>
            <span>·</span>
            <span>{selectedSurah.revelationType} ({selectedSurah.versesCount} Ayahs)</span>
          </div>

          <button
            onClick={() => setSelectedSurahNumber(Math.min(114, selectedSurahNumber + 1))}
            disabled={selectedSurahNumber >= 114}
            className="flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30 disabled:pointer-events-none"
          >
            <span className="hidden sm:inline">Next Surah</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h1 className="font-arabic text-4xl sm:text-5xl font-bold text-emerald-900 dark:text-emerald-300 pt-2">
          {selectedSurah.nameArabic}
        </h1>

        <div className="flex items-center justify-center gap-3">
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
            {selectedSurah.transliteration}
          </h2>
          <span className="text-stone-300 dark:text-stone-700">·</span>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            "{selectedSurah.nameEnglish}"
          </span>
          <span className="text-stone-300 dark:text-stone-700">·</span>
          <span className="text-sm font-urdu text-stone-700 dark:text-stone-300">
            {selectedSurah.nameUrdu}
          </span>
        </div>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-stone-600 dark:text-stone-400 pt-1 leading-relaxed">
          {selectedSurah.themeUrdu}
        </p>

        {/* Action button to jump to Dr. Israr Ahmed's Tafseer of this Surah */}
        {onNavigateToBayan && (
          <div className="pt-2">
            <button
              onClick={() => onNavigateToBayan(selectedSurah.number)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Listen to Bayan-ul-Quran (Dr. Israr Ahmed) for Surah {selectedSurah.transliteration}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Ayahs Stream */}
      {isLoadingAyahs ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-500">Loading Ayahs for Surah {selectedSurah.transliteration}...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ayahs.map((ayah) => {
            const isPlayingThisAyah = isPlayingAudio && currentPlayingAyah === ayah.numberInSurah;
            const bookmarkKey = `${selectedSurah.number}-${ayah.numberInSurah}`;
            const isBookmarked = bookmarkedVerses.includes(bookmarkKey);
            const isCopied = copiedKey === bookmarkKey;

            return (
              <div
                key={ayah.numberInSurah}
                id={`ayah-${ayah.numberInSurah}`}
                className={`rounded-xl border p-5 sm:p-6 transition-colors ${
                  isPlayingThisAyah
                    ? 'border-emerald-600/70 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90'
                }`}
              >
                {/* Verse Header Ribbon */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 dark:border-stone-800 text-xs text-stone-400">
                  <span className="font-mono font-medium text-stone-500 dark:text-stone-400">
                    {selectedSurah.number}:{ayah.numberInSurah}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Play Audio Button */}
                    {ayah.audioUrl && (
                      <button
                        onClick={() => playAyahAudio(ayah.numberInSurah, ayah.audioUrl)}
                        className={`p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                          isPlayingThisAyah ? 'text-emerald-600 font-medium' : 'text-stone-500'
                        }`}
                        title="Recite this verse (Mishary Alafasy)"
                      >
                        {isPlayingThisAyah ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Bookmark Button */}
                    <button
                      onClick={() => toggleBookmark(bookmarkKey)}
                      className={`p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                        isBookmarked ? 'text-amber-500' : 'text-stone-400'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Verse'}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyVerse(ayah)}
                      className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                      title="Copy verse and translation"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Arabic Text (Right-to-Left) */}
                <p
                  dir="rtl"
                  className="font-arabic text-stone-900 dark:text-stone-100 text-right leading-loose mb-4 font-normal"
                  style={{ fontSize: `${arabicFontSize}px` }}
                >
                  {ayah.textArabic}
                </p>

                {/* Urdu Translation */}
                {(displayMode === 'all' || displayMode === 'arabic-urdu') && ayah.textUrdu && (
                  <p
                    dir="rtl"
                    className="font-urdu text-right text-stone-800 dark:text-stone-200 leading-loose border-t border-stone-100 dark:border-stone-800/60 pt-3 mb-2"
                    style={{ fontSize: `${translationFontSize}px` }}
                  >
                    {ayah.textUrdu}
                  </p>
                )}

                {/* English Translation */}
                {(displayMode === 'all' || displayMode === 'arabic-english') && ayah.textEnglish && (
                  <p
                    dir="ltr"
                    className="text-left text-stone-600 dark:text-stone-400 leading-relaxed text-sm pt-2"
                    style={{ fontSize: `${Math.max(13, translationFontSize - 2)}px` }}
                  >
                    {ayah.textEnglish}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
