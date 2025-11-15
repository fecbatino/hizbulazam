import React from 'react';

export interface AppSettings {
    showFavorites: boolean;
    showShare: boolean;
    arabicFontSize: number; // Using a numeric value like rem
    translationFontSize: number; // Using a numeric value like rem
    showTranslation: boolean;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSettingsChange: (newSettings: Partial<AppSettings>) => void;
}

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


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    if (!isOpen) {
        return null;
    }

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
                <h3 id="settings-title" className="font-bold text-lg mb-6 text-slate-800 dark:text-slate-100 text-center">
                    Settings
                </h3>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Toggle 
                            label="Show Favorite Buttons"
                            checked={settings.showFavorites}
                            onChange={(value) => onSettingsChange({ showFavorites: value })}
                        />
                        <Toggle 
                            label="Show Share Buttons"
                            checked={settings.showShare}
                            onChange={(value) => onSettingsChange({ showShare: value })}
                        />
                    </div>
                    <hr className="border-slate-200 dark:border-slate-700" />
                    <div className="space-y-3">
                        <label htmlFor="font-size-slider" className="block text-slate-700 dark:text-slate-300">
                            Arabic Font Size
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
                            Translation Font Size
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
