export type TabType = 'prayer' | 'quran' | 'bayan' | 'qibla-calendar' | 'zakat';

export interface LocationInfo {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export type CalculationMethod = 'Karachi' | 'MWL' | 'ISNA' | 'Makkah' | 'Egypt' | 'Tehran' | 'Gulf';
export type JuristicMethod = 'Hanafi' | 'Standard'; // Standard = Shafi'i, Maliki, Hanbali

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  fajrDate: Date;
  sunriseDate: Date;
  dhuhrDate: Date;
  asrDate: Date;
  maghribDate: Date;
  ishaDate: Date;
}

export interface SurahMeta {
  number: number;
  nameArabic: string;
  nameEnglish: string;
  nameUrdu: string;
  transliteration: string;
  versesCount: number;
  revelationType: 'Meccan' | 'Medinan';
  revelationOrder: number;
  juzNumber: number;
  volume: number; // Volume in Dr. Israr Ahmed's 7-vol Bayan-ul-Quran
  bayanUrduAudioUrl: string;
  archiveAudioUrl: string;
  themeUrdu: string;
  themeEnglish: string;
  archiveBookPage?: number;
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  textArabic: string;
  textUrdu: string;
  textEnglish: string;
  juz: number;
  audioUrl?: string;
}

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthNameEn: string;
  monthNameAr: string;
  formatted: string;
}

export interface IslamicEvent {
  title: string;
  titleUrdu: string;
  hijriDay: number;
  hijriMonth: number;
  description: string;
}

export interface ZakatState {
  currency: string;
  goldPricePerGram: number;
  silverPricePerGram: number;
  nisabBasis: 'silver' | 'gold';
  // Assets
  cashInHand: number;
  cashInBank: number;
  goldGrams24k: number;
  goldGrams22k: number;
  silverGrams: number;
  sharesAndStocks: number;
  businessGoods: number;
  moneyOwedToYou: number;
  otherZakatableAssets: number;
  // Liabilities
  shortTermDebts: number;
  billsDue: number;
  businessLiabilities: number;
}

export interface BayanVolume {
  volume: number;
  title: string;
  surahsCovered: string;
  archiveLink: string;
  summary: string;
}

export interface PrayerAlarmSettings {
  enabled: boolean;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  volume: number;
}
