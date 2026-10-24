import React, { useState, useRef, useEffect } from 'react';
import { SurahMeta } from '../types';
import { SURAHS_DATA, BAYAN_VOLUMES, getVolumeForSurah } from '../data/surahs';
import { DR_ISRAR_INTRO, DETAILED_TAFSEER_DATA, DetailedTafseerSection } from '../data/bayanUlQuranData';
import { getBayanAudioUrl } from '../data/bayanAudioMap';
import {
  Play,
  Pause,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  BookOpen,
  Headphones,
  BookMarked,
  Search,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  Maximize2,
  Radio,
  AlertCircle,
  FileText
} from 'lucide-react';

interface BayanUlQuranViewProps {
  initialSurahNumber?: number;
}

export const BayanUlQuranView: React.FC<BayanUlQuranViewProps> = ({
  initialSurahNumber = 1
}) => {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(initialSurahNumber);
  const [activeSubTab, setActiveSubTab] = useState<'audio' | 'reading' | 'volumes'>('reading');
  const [activeReadingMode, setActiveReadingMode] = useState<'pdf' | 'text'>('pdf');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [embeddedVolumeNum, setEmbeddedVolumeNum] = useState<number>(() =>
    getVolumeForSurah(initialSurahNumber)
  );

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showEmbedAudioPlayer, setShowEmbedAudioPlayer] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedSurah: SurahMeta =
    SURAHS_DATA.find((s) => s.number === selectedSurahNumber) || SURAHS_DATA[0];

  const currentVolumeNum = getVolumeForSurah(selectedSurah.number);
  const currentVolume = BAYAN_VOLUMES.find((v) => v.volume === currentVolumeNum) || BAYAN_VOLUMES[0];
  const detailedTafseer: DetailedTafseerSection | undefined = DETAILED_TAFSEER_DATA[selectedSurah.number];

  // Update embedded volume when selected surah changes
  useEffect(() => {
    setEmbeddedVolumeNum(getVolumeForSurah(selectedSurahNumber));
  }, [selectedSurahNumber]);

  // Audio safety: when surah changes, handle audio without eager loading
  useEffect(() => {
    setAudioError(null);
    setCurrentTime(0);
    setDuration(0);

    if (audioRef.current) {
      if (isPlaying) {
        const newUrl = getBayanAudioUrl(selectedSurahNumber);
        audioRef.current.src = newUrl;
        audioRef.current.playbackRate = playbackSpeed;
        setIsConnecting(true);
        audioRef.current
          .play()
          .then(() => setIsConnecting(false))
          .catch((err) => {
            console.warn('Playback error:', err);
            setIsPlaying(false);
            setIsConnecting(false);
          });
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
        setIsConnecting(false);
      }
    }
  }, [selectedSurahNumber]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsConnecting(false);
    } else {
      setAudioError(null);
      setIsConnecting(true);
      const targetUrl = getBayanAudioUrl(selectedSurah.number);

      if (audioRef.current.src !== targetUrl) {
        audioRef.current.src = targetUrl;
      }
      audioRef.current.playbackRate = playbackSpeed;

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsConnecting(false);
        })
        .catch((err) => {
          console.warn('Audio play failed:', err);
          setIsPlaying(false);
          setIsConnecting(false);
          setAudioError(
            'Audio stream is buffering. You can use the built-in Archive player widget below.'
          );
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const skipSeconds = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + seconds)
      );
    }
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 1.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || sec === 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const h = Math.floor(m / 60);
    if (h > 0) {
      return `${h}:${(m % 60).toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredSurahs = SURAHS_DATA.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.number.toString() === q ||
      s.transliteration.toLowerCase().includes(q) ||
      s.nameEnglish.toLowerCase().includes(q) ||
      s.nameUrdu.includes(q)
    );
  });

  // Construct embedded book reader URL for the active volume
  const embeddedBookUrl = `https://archive.org/details/bayan-ul-quran-dr-israr/bayan-ul-quran-dr-israr-urdu-vol-${embeddedVolumeNum}?view=theater&ui=embed`;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Safe Audio Element with preload="none" and zero initial src */}
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={() => setIsConnecting(false)}
        onWaiting={() => setIsConnecting(true)}
        onPlaying={() => {
          setIsConnecting(false);
          setIsPlaying(true);
        }}
        onError={() => {
          setIsPlaying(false);
          setIsConnecting(false);
          setAudioError(
            'Direct stream is buffering. Switch to the built-in Archive.org Player widget below for seamless listening.'
          );
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (selectedSurahNumber < 114) {
            setSelectedSurahNumber(selectedSurahNumber + 1);
          }
        }}
      />

      {/* Header Banner: Dr. Israr Ahmed's Bayan-ul-Quran (Zero External Links) */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              <span>{DR_ISRAR_INTRO.title}</span>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span>{DR_ISRAR_INTRO.lifespan}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
              بیان القرآن — ڈاکٹر اسرار احمد (رحمۃ اللہ علیہ)
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-urdu pt-1">
              {DR_ISRAR_INTRO.summaryUrdu}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-stone-500">
              <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 font-medium">
                Complete 7 Printed Volumes Embedded
              </span>
              <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 font-medium">
                All 114 Surahs Audio Lectures
              </span>
              <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 font-medium">
                Urdu Commentary & Thematic Analysis
              </span>
            </div>
          </div>

          {/* Sub-Tabs: Reading Tafseer (Embedded PDF & Text), Audio Player, 7 Volumes */}
          <div className="flex lg:flex-col gap-2 shrink-0 bg-stone-100 dark:bg-stone-800/80 p-1.5 rounded-xl self-start w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveSubTab('reading')}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === 'reading'
                  ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Tafseer (PDF & Text)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('audio')}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === 'audio'
                  ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Audio Lecture Player</span>
            </button>

            <button
              onClick={() => setActiveSubTab('volumes')}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === 'volumes'
                  ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>7 Volumes Index</span>
            </button>
          </div>
        </div>
      </div>

      {/* Surah Selector & Quick Volume Switcher Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
            Selected Surah:
          </span>
          <select
            value={selectedSurahNumber}
            onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
            className="p-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 focus:outline-emerald-600 min-h-[44px]"
          >
            {SURAHS_DATA.map((s) => (
              <option key={s.number} value={s.number}>
                {s.number}. {s.transliteration} ({s.nameUrdu}) - Vol {s.volume}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs text-stone-400 whitespace-nowrap mr-1">Switch Volume:</span>
          {BAYAN_VOLUMES.map((v) => (
            <button
              key={v.volume}
              onClick={() => {
                setEmbeddedVolumeNum(v.volume);
                setActiveSubTab('reading');
                setActiveReadingMode('pdf');
              }}
              className={`px-2.5 py-1.5 text-xs rounded-md whitespace-nowrap min-h-[36px] transition-colors ${
                embeddedVolumeNum === v.volume
                  ? 'bg-emerald-700 text-white font-medium shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              Vol {v.volume}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: READ TAFSEER (EMBEDDED PDF & FORMATTED TEXT) */}
      {activeSubTab === 'reading' && (
        <div className="space-y-6">
          {/* Reading Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                Reading Mode: {activeReadingMode === 'pdf' ? `Embedded PDF Book Viewer (Volume ${embeddedVolumeNum})` : `Urdu Study Notes (Surah ${selectedSurah.transliteration})`}
              </h2>
              <p className="text-xs text-stone-500">
                {activeReadingMode === 'pdf'
                  ? 'Read the complete digitized printed volume directly inside the app with page-turn and zoom controls.'
                  : 'Read curated Urdu thematic commentary, background, and analytical notes.'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg self-start sm:self-auto">
              <button
                onClick={() => setActiveReadingMode('pdf')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md min-h-[40px] transition-colors ${
                  activeReadingMode === 'pdf'
                    ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Embedded PDF Book</span>
              </button>

              <button
                onClick={() => setActiveReadingMode('text')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md min-h-[40px] transition-colors ${
                  activeReadingMode === 'text'
                    ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Urdu Text Notes</span>
              </button>
            </div>
          </div>

          {/* MODE A: EMBEDDED PDF BOOK READER */}
          {activeReadingMode === 'pdf' && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white font-urdu">
                    {BAYAN_VOLUMES.find((v) => v.volume === embeddedVolumeNum)?.title}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {BAYAN_VOLUMES.find((v) => v.volume === embeddedVolumeNum)?.surahsCovered}
                  </p>
                </div>

                <div className="text-xs text-stone-400">
                  Interactive Flipbook · Embedded Viewer
                </div>
              </div>

              {/* Responsive Embedded IFrame Book Viewer */}
              <div className="relative w-full h-[520px] sm:h-[650px] lg:h-[750px] rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-900">
                <iframe
                  key={`bayan-vol-${embeddedVolumeNum}`}
                  src={embeddedBookUrl}
                  title={`Bayan-ul-Quran Volume ${embeddedVolumeNum} Embedded Reader`}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 pt-2">
                <span>Tip: Use the toolbar inside the embedded reader to zoom, switch to two-page view, or search pages.</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEmbeddedVolumeNum(Math.max(1, embeddedVolumeNum - 1))}
                    disabled={embeddedVolumeNum <= 1}
                    className="px-2.5 py-1 rounded border border-stone-200 dark:border-stone-800 disabled:opacity-40"
                  >
                    Previous Volume
                  </button>
                  <span className="font-mono">{embeddedVolumeNum} / 7</span>
                  <button
                    onClick={() => setEmbeddedVolumeNum(Math.min(7, embeddedVolumeNum + 1))}
                    disabled={embeddedVolumeNum >= 7}
                    className="px-2.5 py-1 rounded border border-stone-200 dark:border-stone-800 disabled:opacity-40"
                  >
                    Next Volume
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE B: FORMATTED URDU TEXT COMMENTARY */}
          {activeReadingMode === 'text' && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-8 shadow-xs">
              <div className="pb-6 border-b border-stone-200 dark:border-stone-800 space-y-1">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  مطبوعہ تفسیر بیان القرآن · {currentVolume.title}
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white">
                  سورۃ {selectedSurah.transliteration} ({selectedSurah.nameArabic}) کا تفصیلی مطالعہ
                </h2>
              </div>

              {/* Introduction & Shan-e-Nuzul */}
              <div className="space-y-3">
                <h3 className="text-lg font-serif font-semibold text-emerald-900 dark:text-emerald-400 border-b border-stone-100 dark:border-stone-800 pb-2">
                  تعارف و پس منظر (Introduction & Context)
                </h3>
                <p className="font-urdu text-stone-800 dark:text-stone-200 leading-loose text-base sm:text-lg">
                  {detailedTafseer ? detailedTafseer.tarufOShanENuzul : selectedSurah.themeUrdu}
                </p>
              </div>

              {/* Central Theme */}
              <div className="space-y-3 bg-stone-50 dark:bg-stone-800/40 p-5 rounded-xl border border-stone-200 dark:border-stone-800">
                <h3 className="text-base font-serif font-semibold text-stone-900 dark:text-stone-100">
                  مرکزی مضمون و فلسفۂ سورت (Central Theme)
                </h3>
                <p className="font-urdu text-stone-800 dark:text-stone-200 leading-loose text-base">
                  {detailedTafseer ? detailedTafseer.markaziMazmoon : selectedSurah.themeUrdu}
                </p>
                <p className="text-xs text-stone-500 font-sans pt-1">
                  Summary: {selectedSurah.themeEnglish}
                </p>
              </div>

              {/* Key Analytical Points */}
              <div className="space-y-3">
                <h3 className="text-lg font-serif font-semibold text-emerald-900 dark:text-emerald-400 border-b border-stone-100 dark:border-stone-800 pb-2">
                  اہم نکات و قرآنی ہدایات (Key Thematic Points)
                </h3>
                {detailedTafseer && detailedTafseer.khasNukat ? (
                  <ul className="space-y-2.5 font-urdu text-stone-800 dark:text-stone-200 text-base leading-relaxed">
                    {detailedTafseer.khasNukat.map((nukta, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-2.5 shrink-0" />
                        <span>{nukta}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-urdu text-stone-700 dark:text-stone-300 leading-loose">
                    ڈاکٹر اسرار احمدؒ کے مطابق اس سورہ مبارکہ کا بنیادی مقصد انسانوں کو اللہ کی توحید، نبی کریم ﷺ کی رسالت اور روزِ جزا کی قطعی جوابدہی کے احساس سے روشناس کرانا ہے۔ اس کی تلاوت کے ساتھ فہم اور غوروخوض مومن کی زندگی میں اخلاقی اور فکری انقلاب کا پیش خیمہ بنتا ہے۔
                  </p>
                )}
              </div>

              {/* Detailed Excerpts */}
              {detailedTafseer && detailedTafseer.detailedCommentaryUrdu && (
                <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                  <h3 className="text-lg font-serif font-semibold text-emerald-900 dark:text-emerald-400">
                    تفصیلی مطالعہ اور فکری بصیرت (Detailed Commentary Excerpt)
                  </h3>
                  {detailedTafseer.detailedCommentaryUrdu.map((para, i) => (
                    <p key={i} className="font-urdu text-stone-800 dark:text-stone-200 leading-loose text-base sm:text-lg">
                      {para}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: AUDIO TAFSEER PLAYER (WITH EMBEDDED AUDIO WIDGET) */}
      {activeSubTab === 'audio' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-linear-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 p-5 sm:p-8 space-y-6 shadow-xs">
            {/* Track Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800/80 pb-5">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Audio Lecture Series · Bayan-ul-Quran (Dr. Israr Ahmed)
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white">
                  Surah {selectedSurah.number}: {selectedSurah.transliteration} ({selectedSurah.nameArabic})
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-urdu pt-0.5">
                  تفسیر و فکری تشریح از ڈاکٹر اسرار احمدؒ — {selectedSurah.themeUrdu}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmbedAudioPlayer(!showEmbedAudioPlayer)}
                  className="px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{showEmbedAudioPlayer ? 'Hide Embed Player' : 'Embedded Full Player'}</span>
                </button>
              </div>
            </div>

            {/* Embedded Audio Widget (Embedded inside app) */}
            {showEmbedAudioPlayer && (
              <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-black">
                <iframe
                  title="Archive.org Bayan-ul-Quran Player"
                  src="https://archive.org/embed/Bayan-ul-Quran-in-Urdu-by-Dr-Israr-Ahmed-Audio-MP3-CD"
                  width="100%"
                  height="260"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            )}

            {/* Connecting Spinner / Status Banner */}
            {isConnecting && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Connecting to Bayan-ul-Quran audio stream...</span>
              </div>
            )}

            {/* Audio Error Banner with Embed Player Fallback */}
            {audioError && (
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
                <div className="flex items-start sm:items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
                  <span>{audioError}</span>
                </div>
                <button
                  onClick={() => setShowEmbedAudioPlayer(true)}
                  className="px-3 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/60 rounded-md hover:bg-amber-200 shrink-0"
                >
                  Open Embedded Player
                </button>
              </div>
            )}

            {/* Seekbar & Timestamps */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-emerald-600 h-1.5 cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs font-mono tabular-nums text-stone-500">
                <span>{formatAudioTime(currentTime)}</span>
                <span>{duration > 0 ? formatAudioTime(duration) : '00:00'}</span>
              </div>
            </div>

            {/* Playback Controls Strip (Mobile Friendly) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                onClick={cyclePlaybackSpeed}
                className="px-3 py-2 min-h-[44px] min-w-[44px] text-xs font-mono font-medium rounded-xl border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Playback Speed"
              >
                {playbackSpeed}x
              </button>

              {/* Main Play / Seek buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => skipSeconds(-15)}
                  className="p-3 min-h-[44px] min-w-[44px] rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors flex items-center justify-center"
                  title="Rewind 15 seconds"
                >
                  <Rewind className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="p-4 min-h-[52px] min-w-[52px] rounded-full bg-emerald-700 hover:bg-emerald-800 text-white transition-transform active:scale-95 shadow-md flex items-center justify-center"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current pl-0.5" />}
                </button>

                <button
                  onClick={() => skipSeconds(15)}
                  className="p-3 min-h-[44px] min-w-[44px] rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors flex items-center justify-center"
                  title="Forward 15 seconds"
                >
                  <FastForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newMute = !isMuted;
                    setIsMuted(newMute);
                    if (audioRef.current) {
                      audioRef.current.muted = newMute;
                    }
                  }}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    setIsMuted(false);
                    if (audioRef.current) {
                      audioRef.current.volume = v;
                      audioRef.current.muted = false;
                    }
                  }}
                  className="w-20 accent-emerald-600 h-1.5"
                />
              </div>
            </div>
          </div>

          {/* Surah Playlist Grid */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-stone-900 dark:text-white">
                Audio Lectures Tracklist (All 114 Surahs)
              </h3>
              <div className="relative max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter Surah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 min-h-[40px] w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredSurahs.map((s) => {
                const isCurrent = s.number === selectedSurahNumber;
                return (
                  <button
                    key={s.number}
                    onClick={() => setSelectedSurahNumber(s.number)}
                    className={`text-left p-3 rounded-lg border flex items-center justify-between min-h-[44px] transition-colors ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 font-medium'
                        : 'border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-stone-400 w-5">{s.number}.</span>
                      <div>
                        <p className="text-xs font-semibold">{s.transliteration}</p>
                        <p className="text-[11px] text-stone-500 font-urdu">{s.nameUrdu}</p>
                      </div>
                    </div>
                    {isCurrent && isPlaying ? (
                      <span className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">Playing</span>
                    ) : (
                      <Play className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: 7 VOLUMES ARCHIVE LIBRARY (EMBEDDED VIEWER ON CLICK) */}
      {activeSubTab === 'volumes' && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 py-2">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
              بیان القرآن — مکمل سات جلدیں (Complete 7 Volumes)
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-urdu">
              ڈاکٹر اسرار احمدؒ کی تالیف کردہ مطبوعہ تفسیرِ قرآن کے تمام ساتوں والیمز، جنہیں آپ اسی ویب ایپ کے اندر مکمل ورق گردانی اور زوم کے ساتھ پڑھ سکتے ہیں۔
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BAYAN_VOLUMES.map((vol) => (
              <div
                key={vol.volume}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 flex flex-col justify-between space-y-4 shadow-xs hover:border-emerald-600 dark:hover:border-emerald-500 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="font-mono uppercase font-semibold text-emerald-700 dark:text-emerald-400">
                      Volume {vol.volume}
                    </span>
                    <span>Embedded Book</span>
                  </div>

                  <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white font-urdu">
                    {vol.title}
                  </h3>

                  <p className="text-xs font-medium text-stone-600 dark:text-stone-300">
                    {vol.surahsCovered}
                  </p>

                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed pt-1">
                    {vol.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => {
                      setEmbeddedVolumeNum(vol.volume);
                      setActiveSubTab('reading');
                      setActiveReadingMode('pdf');
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="w-full py-2.5 px-4 min-h-[44px] text-xs font-medium text-center rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors inline-flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Volume {vol.volume} (Embedded)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
