import React from 'react';
import { Language } from '../types';

export type BottomTab = 'duas' | 'favorites' | 'days' | 'settings';

interface BottomNavProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  language: Language;
}

const TABS: { id: BottomTab; icon: string; labels: Record<Language, string> }[] = [
  { id: 'duas',      icon: '📖', labels: { en: 'Duas', de: 'Duas', fr: 'Duas', ar: 'أدعية' } },
  { id: 'favorites', icon: '☆',  labels: { en: 'Favorites', de: 'Favoriten', fr: 'Favoris', ar: 'المفضلة' } },
  { id: 'days',      icon: '📅', labels: { en: 'Days', de: 'Tage', fr: 'Jours', ar: 'الأيام' } },
  { id: 'settings',  icon: '⚙',  labels: { en: 'Settings', de: 'Einstellungen', fr: 'Paramètres', ar: 'الإعدادات' } },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, language }) => (
  <nav
    role="navigation"
    aria-label="Main navigation"
    style={{
      background: 'var(--hza-card)',
      borderTop: '1px solid var(--hza-border)',
      display: 'flex',
      padding: '8px 0 16px',
      position: 'sticky',
      bottom: 0,
      zIndex: 40,
    }}
  >
    {TABS.map(({ id, icon, labels }) => {
      const isActive = activeTab === id;
      return (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          aria-label={labels[language]}
          aria-current={isActive ? 'page' : undefined}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '6px 4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isActive ? 'var(--hza-green)' : 'var(--hza-hint)',
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500 }}>
            {labels[language]}
          </span>
        </button>
      );
    })}
  </nav>
);
