import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../types';

interface LanguageSelectorProps {
  variant?: 'header' | 'prominent' | 'compact';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentLang = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'prominent') {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
            <Globe className="w-4 h-4 text-amber-600" />
            <span>{t('selectLanguage')}:</span>
          </span>
          <div className="inline-flex rounded-xl bg-amber-100/90 p-1 border border-yellow-300">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                id={`btn-lang-${lang.code}`}
                onClick={() => handleSelect(lang.code)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  language === lang.code
                    ? 'bg-amber-500 text-amber-950 shadow-xs'
                    : 'text-amber-900 hover:bg-amber-200/70'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="btn-language-dropdown"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-yellow-300 bg-white hover:bg-amber-100/60 text-amber-950 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        title={t('selectLanguage')}
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-amber-600" />
        <span className="font-bold">{currentLang.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-amber-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white border-2 border-yellow-300 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider border-b border-yellow-100">
            {t('selectLanguage')}
          </div>
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              id={`btn-select-language-${lang.code}`}
              onClick={() => handleSelect(lang.code)}
              className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                language === lang.code
                  ? 'bg-amber-100 text-amber-950 font-bold'
                  : 'text-amber-900 hover:bg-amber-50'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold">{lang.nativeName}</span>
                <span className="text-[10px] text-amber-700/80">{lang.englishName}</span>
              </div>
              {language === lang.code && <Check className="w-4 h-4 text-amber-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
