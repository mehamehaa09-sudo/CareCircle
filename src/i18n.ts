import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import ml from './locales/ml.json';
import te from './locales/te.json';

export type Language = 'en' | 'ta' | 'hi' | 'ml' | 'te';

export const languages: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
];

const translations: Record<Language, typeof en> = {
  en,
  ta,
  hi,
  ml,
  te,
};

export const getTranslation = (lang: Language, key: string): string => {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    if (value[k] === undefined) {
      // Fallback to English if translation not found
      let fallback: any = translations.en;
      for (const fk of keys) {
        fallback = fallback[fk];
      }
      return fallback || key;
    }
    value = value[k];
  }

  return value || key;
};

export const t = (lang: Language, key: string): string => {
  return getTranslation(lang, key);
};
