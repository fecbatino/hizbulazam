
import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const CYCLE: Language[] = ['de', 'en', 'fr'];
const LABELS: Record<Language, string> = { de: 'DE', en: 'EN', fr: 'FR', ar: 'عر' };

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => {
  const handleClick = () => {
    const idx = CYCLE.indexOf(currentLanguage);
    const next = CYCLE[(idx === -1 ? 0 : idx + 1) % CYCLE.length];
    onLanguageChange(next);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`Language: ${currentLanguage.toUpperCase()}, click to cycle`}
      style={{
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '8px',
        padding: '8px 14px',
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span>🌐</span>
      <span>{LABELS[currentLanguage] ?? currentLanguage.toUpperCase()}</span>
    </button>
  );
};
