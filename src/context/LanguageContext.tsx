import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, LanguageInfo } from '../types';
import { SUPPORTED_LANGUAGES, Translations, getTranslation } from '../translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
  currentLanguageInfo: LanguageInfo;
  supportedLanguages: LanguageInfo[];
  formatLocalizedDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatLocalizedTime: (time24: string) => string;
}

const LANGUAGE_STORAGE_KEY = 'carecircle_language_v1';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Locale mapping for standard browser Intl
const LOCALE_MAP: Record<LanguageCode, string> = {
  en: 'en-US',
  ta: 'ta-IN',
  hi: 'hi-IN',
  ml: 'ml-IN',
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && (['en', 'ta', 'hi', 'ml'] as string[]).includes(saved)) {
        return saved as LanguageCode;
      }
    } catch (e) {
      console.error('Failed to load language from storage:', e);
    }
    return 'en';
  });

  const setLanguage = (newLang: LanguageCode) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch (e) {
      console.error('Failed to save language to storage:', e);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: keyof Translations, params?: Record<string, string | number>): string => {
    return getTranslation(language, key, params);
  };

  const currentLanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const formatLocalizedDate = (
    dateInput: Date | string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const locale = LOCALE_MAP[language] || 'en-US';
    try {
      return d.toLocaleDateString(locale, options || { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) {
      return d.toLocaleDateString('en-US', options);
    }
  };

  const formatLocalizedTime = (time24: string): string => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const isPM = h >= 12;

    if (h === 0) h = 12;
    else if (h > 12) h -= 12;

    const periodEn = isPM ? 'PM' : 'AM';

    // Localized periods
    let period = periodEn;
    if (language === 'ta') {
      period = isPM ? 'பி.ப' : 'மு.ப';
    } else if (language === 'hi') {
      period = isPM ? 'दोपहर/रात' : 'सुबह';
    } else if (language === 'ml') {
      period = isPM ? 'പി.എം' : 'എ.എം';
    }

    return `${h}:${m} ${period}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentLanguageInfo,
        supportedLanguages: SUPPORTED_LANGUAGES,
        formatLocalizedDate,
        formatLocalizedTime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
