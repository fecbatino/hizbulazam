import React from 'react';
import { Language } from '../types';

export interface AppSettings {
    showFavorites: boolean;
    showShare: boolean;
    arabicFontSize: number;
    translationFontSize: number;
    showTranslation: boolean;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSettingsChange: (newSettings: Partial<AppSettings>) => void;
    language: Language;
}

const SETTINGS_T = {
    en: { title: 'Settings', showFavorites: 'Show Favorite Buttons', showShare: 'Show Share Buttons', showTranslation: 'Show Translation', arabicFont: 'Arabic Font Size', translationFont: 'Translation Font Size' },
    de: { title: 'Einstellungen', showFavorites: 'Favoriten-Buttons anzeigen', showShare: 'Teilen-Buttons anzeigen', showTranslation: 'Übersetzung anzeigen', arabicFont: 'Arabische Schriftgröße', translationFont: 'Übersetzungsschriftgröße' },
    fr: { title: 'Paramètres', showFavorites: 'Afficher les boutons de favoris', showShare: 'Afficher les boutons de partage', showTranslation: 'Afficher la traduction', arabicFont: 'Taille de police arabe', translationFont: 'Taille de police de traduction' },
    ar: { title: 'الإعدادات', showFavorites: 'إظهار أزرار المفضلة', showShare: 'إظهار أزرار المشاركة', showTranslation: 'عرض الترجمة', arabicFont: 'حجم الخط العربي', translationFont: 'حجم خط الترجمة' },
};

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between cursor-pointer">
        <span className="text-slate-700 dark:text-slate-300">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
        </div>
    </label>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange, language }) => {
    if (!isOpen) return null;

    const t = SETTINGS_T[language] ?? SETTINGS_T.en;

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ arabicFontSize: parseFloat(e.target.value) });
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 id="settings-title" className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        {t.title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Close settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Toggle
                            label={t.showFavorites}
                            checked={settings.showFavorites}
                            onChange={(value) => onSettingsChange({ showFavorites: value })}
                        />
                        <Toggle
                            label={t.showShare}
                            checked={settings.showShare}
                            onChange={(value) => onSettingsChange({ showShare: value })}
                        />
                        {language !== 'ar' && (
                            <Toggle
                                label={t.showTranslation}
                                checked={settings.showTranslation}
                                onChange={(value) => onSettingsChange({ showTranslation: value })}
                            />
                        )}
                    </div>
                    <hr className="border-slate-200 dark:border-slate-700" />
                    <div className="space-y-3">
                        <label htmlFor="font-size-slider" className="block text-slate-700 dark:text-slate-300">
                            {t.arabicFont}
                        </label>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">A</span>
                            <input
                                id="font-size-slider"
                                type="range"
                                min="1.25"
                                max="3"
                                step="0.125"
                                value={settings.arabicFontSize}
                                onChange={handleFontSizeChange}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                            />
                            <span className="text-2xl text-slate-500">A</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label htmlFor="translation-font-size-slider" className="block text-slate-700 dark:text-slate-300">
                            {t.translationFont}
                        </label>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">A</span>
                            <input
                                id="translation-font-size-slider"
                                type="range"
                                min="0.8"
                                max="1.5"
                                step="0.1"
                                value={settings.translationFontSize ?? 1}
                                onChange={(e) => onSettingsChange({ translationFontSize: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                            />
                            <span className="text-lg text-slate-500">A</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
