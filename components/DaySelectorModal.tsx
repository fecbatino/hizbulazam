
import React from 'react';
import { Language } from '../types';

interface DaySelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDay: (index: number) => void;
    days: string[];
    currentIndex: number;
    language: Language;
}

const DAY_SELECTOR_T: Record<Language, string> = {
    en: 'Select a Day',
    de: 'Tag auswählen',
    fr: 'Choisir un jour',
    ar: 'اختر يومًا',
};

export const DaySelectorModal: React.FC<DaySelectorModalProps> = ({ isOpen, onClose, onSelectDay, days, currentIndex, language }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="day-selector-title"
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-xs"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="day-selector-title" className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 text-center">
                    {DAY_SELECTOR_T[language] ?? DAY_SELECTOR_T.en}
                </h3>
                <ul className="space-y-2">
                    {days.map((day, index) => (
                        <li key={index}>
                            <button
                                onClick={() => onSelectDay(index)}
                                className={`w-full text-start p-3 rounded-lg font-semibold transition-colors duration-200 ${
                                    currentIndex === index
                                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                {day}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
