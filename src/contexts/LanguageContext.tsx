import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get saved language from localStorage
    const saved = localStorage.getItem('carecircle_language') as Language | null;
    // Fallback to browser language or English
    if (saved && ['en', 'ta', 'hi', 'ml', 'te'].includes(saved)) {
      return saved;
    }
    
    const browserLang = navigator.language.split('-')[0];
    if (['ta', 'hi', 'ml', 'te'].includes(browserLang)) {
      return browserLang as Language;
    }
    
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('carecircle_language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
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

export const useTranslation = () => {
  const { language } = useLanguage();
  
  return (key: string): string => {
    const keys = key.split('.');
    // Import translations dynamically
    const translations: Record<string, any> = {
      en: require('../locales/en.json'),
      ta: require('../locales/ta.json'),
      hi: require('../locales/hi.json'),
      ml: require('../locales/ml.json'),
      te: require('../locales/te.json'),
    };

    let value: any = translations[language];

    for (const k of keys) {
      if (value[k] === undefined) {
        // Fallback to English
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
};
