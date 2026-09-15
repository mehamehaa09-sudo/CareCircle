import React, { useState } from 'react';
import { Globe, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { languages, Language } from '../i18n';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguageName = languages.find(l => l.code === language)?.name || 'English';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
        title="Change Language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguageName}</span>
        <span className="sm:hidden">{language.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-50 overflow-hidden animate-in fade-in duration-150">
          <div className="p-2 space-y-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as Language);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  language === lang.code
                    ? 'bg-amber-100 text-amber-900'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
