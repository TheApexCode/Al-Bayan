import { HijriDate, IslamicEvent } from '../types';

export const HIJRI_MONTHS = [
  { number: 1, nameEn: 'Muharram', nameAr: 'المُحَرَّم' },
  { number: 2, nameEn: 'Safar', nameAr: 'صَفَر' },
  { number: 3, nameEn: 'Rabi\' al-Awwal', nameAr: 'رَبِيع الأَوَّل' },
  { number: 4, nameEn: 'Rabi\' al-Thani', nameAr: 'رَبِيع الآخِر' },
  { number: 5, nameEn: 'Jumada al-Ula', nameAr: 'جُمَادَى الأُولَى' },
  { number: 6, nameEn: 'Jumada al-Akhirah', nameAr: 'جُمَادَى الآخِرَة' },
  { number: 7, nameEn: 'Rajab', nameAr: 'رَجَب' },
  { number: 8, nameEn: 'Sha\'ban', nameAr: 'شَعْبَان' },
  { number: 9, nameEn: 'Ramadan', nameAr: 'رَمَضَان' },
  { number: 10, nameEn: 'Shawwal', nameAr: 'شَوَّال' },
  { number: 11, nameEn: 'Dhu al-Qa\'dah', nameAr: 'ذُو القَعْدَة' },
  { number: 12, nameEn: 'Dhu al-Hijjah', nameAr: 'ذُو الحِجَّة' }
];

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  {
    title: 'Islamic New Year',
    titleUrdu: 'آغازِ سالِ نو ہجری',
    hijriDay: 1,
    hijriMonth: 1,
    description: '1st of Muharram marking the start of the Hijri calendar commemorating the Prophet\'s migration to Madinah.'
  },
  {
    title: 'Day of Ashura',
    titleUrdu: 'یومِ عاشوراء',
    hijriDay: 10,
    hijriMonth: 1,
    description: '10th of Muharram: deliverance of Prophet Musa from Pharaoh, and the martyrdom of Sayyiduna Imam Hussain (RA) at Karbala.'
  },
  {
    title: 'Mawlid an-Nabi',
    titleUrdu: 'میلاد النبی ﷺ',
    hijriDay: 12,
    hijriMonth: 3,
    description: 'Birth and legacy of the Final Messenger of Allah, Prophet Muhammad ﷺ.'
  },
  {
    title: 'Isra and Mi\'raj',
    titleUrdu: 'واقعۂ معراج النبی ﷺ',
    hijriDay: 27,
    hijriMonth: 7,
    description: 'The miraculous night journey from Makkah to Jerusalem and ascension to the heavens.'
  },
  {
    title: 'Shab-e-Barat (Mid-Sha\'ban)',
    titleUrdu: 'شبِ برأت (نصف شعبان)',
    hijriDay: 15,
    hijriMonth: 8,
    description: 'The 15th night of Sha\'ban, a blessed night of seeking forgiveness and Divine mercy.'
  },
  {
    title: '1st of Ramadan',
    titleUrdu: 'آغازِ ماہِ مبارک رمضان',
    hijriDay: 1,
    hijriMonth: 9,
    description: 'Beginning of the holy month of fasting, Qur\'an recitation, and spiritual purification.'
  },
  {
    title: 'Laylat al-Qadr (The Night of Power)',
    titleUrdu: 'شبِ قدر',
    hijriDay: 27,
    hijriMonth: 9,
    description: 'The grand night better than a thousand months in which the Qur\'an was first revealed.'
  },
  {
    title: 'Eid al-Fitr',
    titleUrdu: 'عید الفطر مبارک',
    hijriDay: 1,
    hijriMonth: 10,
    description: '1st of Shawwal: celebration of the completion of Ramadan fasting and gratefulness to Allah.'
  },
  {
    title: 'Day of Arafah',
    titleUrdu: 'یومِ عرفہ (وقوفِ عرفات)',
    hijriDay: 9,
    hijriMonth: 12,
    description: 'The pinnacle day of Hajj on the plains of Arafat, a day of immense forgiveness and fasting for non-pilgrims.'
  },
  {
    title: 'Eid al-Adha',
    titleUrdu: 'عید الاضحیٰ مبارک',
    hijriDay: 10,
    hijriMonth: 12,
    description: 'Feast of Sacrifice commemorating the devotion of Prophet Ibrahim and Ismail (peace be upon them).'
  },
  {
    title: 'Days of Tashreeq',
    titleUrdu: 'ایامِ تشریق',
    hijriDay: 11,
    hijriMonth: 12,
    description: '11th to 13th of Dhu al-Hijjah: days of remembrance, eating, drinking, and Takbeerat.'
  }
];

/**
 * Kuwaiti / Umm al-Qura standard astronomical algorithm for Gregorian to Hijri conversion
 */
export function getHijriDate(date: Date, adjustmentDays: number = 0): HijriDate {
  // Try using Intl.DateTimeFormat with islamic-umalqura if available
  try {
    const adjustedDate = new Date(date);
    adjustedDate.setDate(adjustedDate.getDate() + adjustmentDays);

    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });

    const parts = formatter.formatToParts(adjustedDate);
    let day = 1;
    let month = 1;
    let year = 1448;

    parts.forEach(p => {
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10);
      if (p.type === 'year') year = parseInt(p.value, 10);
    });

    const mInfo = HIJRI_MONTHS[month - 1] || HIJRI_MONTHS[0];

    return {
      day,
      month,
      year,
      monthNameEn: mInfo.nameEn,
      monthNameAr: mInfo.nameAr,
      formatted: `${day} ${mInfo.nameEn} ${year} AH`
    };
  } catch (e) {
    // Mathematical algorithmic fallback
    const jd = Math.floor(date.getTime() / (1000 * 60 * 60 * 24)) + 2440587.5 + adjustmentDays;
    const l = Math.floor(jd) - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238));
    const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;

    const mInfo = HIJRI_MONTHS[Math.max(0, Math.min(11, month - 1))];
    return {
      day: Math.max(1, Math.min(30, day)),
      month: Math.max(1, Math.min(12, month)),
      year,
      monthNameEn: mInfo.nameEn,
      monthNameAr: mInfo.nameAr,
      formatted: `${day} ${mInfo.nameEn} ${year} AH`
    };
  }
}

/**
 * Checks if a specific Hijri day and month matches any Islamic event
 */
export function getEventForHijriDay(day: number, month: number): IslamicEvent | undefined {
  return ISLAMIC_EVENTS.find(e => e.hijriDay === day && e.hijriMonth === month);
}
