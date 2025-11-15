
import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => {
  return (
    <div className="flex items-center space-x-2 rounded-full bg-slate-200 dark:bg-slate-700 p-1">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => onLanguageChange(code)}
          className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-300 ${
            currentLanguage === code
              ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100'
              : 'bg-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};