import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AboutModal } from './components/AboutModal';
import { DayNavigator } from './components/DayNavigator';
import { DaySelectorModal } from './components/DaySelectorModal';
import { DuaCard } from './components/DuaCard';
import { InformationCircleIcon, MoonIcon, SettingsIcon, SunIcon } from './components/icons';
import { LanguageSelector } from './components/LanguageSelector';
import { AppSettings, SettingsModal } from './components/SettingsModal';
import { DATE_DAY_TO_ORDER_INDEX, DAYS_ORDER } from './constants';
import { DUA_DATA } from './hooks/duas';
import { useSwipe } from './hooks/useSwipe';
import { Language } from './types';


const FAVORITES_STORAGE_KEY = 'dailyDuaFavorites';
const SETTINGS_STORAGE_KEY = 'dailyDuaAppSettings';
const THEME_STORAGE_KEY = 'dailyDuaTheme';

type Theme = 'light' | 'dark';

const defaultSettings: AppSettings = {
    showFavorites: true,
    showShare: true,
    arabicFontSize: 2.0, // in rem
    translationFontSize: 1, // in rem
    showTranslation: true,
};

const ErrorDisplay: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }: { message: string; onDismiss: () => void }) => {
    return (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-[100] flex items-start max-w-sm" role="alert">
            <svg className="w-5 h-5 mr-3 text-red-500 flex-shrink-0 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <div className="flex-grow">
                <p className="font-bold">Application Error</p>
                <p className="text-sm">{message}</p>
            </div>
            <button onClick={onDismiss} className="ml-auto -mr-2 -mt-2 p-1.5" aria-label="Dismiss">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
            </button>
        </div>
    );
};

const TranslationToggleButton: React.FC<{ isVisible: boolean; onToggle: () => void }> = ({ isVisible, onToggle }) => {
    const label = isVisible ? "Hide Translation" : "Show Translation";
    return (
        <button
            onClick={onToggle}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
            aria-label={label}
        >
            {isVisible ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.18l.88-1.472a1.65 1.65 0 0 1 1.541-.959h12.83a1.65 1.65 0 0 1 1.54 1.059l.88 1.472a1.651 1.651 0 0 1 0 1.18l-.88 1.472a1.65 1.65 0 0 1-1.54.959H3.085a1.65 1.65 0 0 1-1.54-.959L.664 10.59ZM10 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.18l-.88-1.472a1.65 1.65 0 0 0-1.54-.959H4.663L3.28 2.22ZM7.75 5.5a4.5 4.5 0 0 1 4.5 4.5 2.25 2.25 0 0 0 2.25 2.25 1.5 1.5 0 0 0 1.5-1.5c0-.986-.425-1.85-1.097-2.443a4.502 4.502 0 0 1-2.153-.614Z" clipRule="evenodd" />
                    <path d="M1.664 10.59a1.651 1.651 0 0 1 0-1.18l.88-1.472A1.65 1.65 0 0 1 4.085 7H15.34a1.65 1.65 0 0 1 1.54 1.059l.88 1.472a1.651 1.651 0 0 1 0 1.18l-.88 1.472a1.65 1.65 0 0 1-1.54.959H8.196a10.03 10.03 0 0 0-1.37-.225H4.085a1.65 1.65 0 0 1-1.54-.959L1.664 10.59Z" />
                </svg>
            )}
        </button>
    );
}

const ThemeToggleButton: React.FC<{ theme: Theme; onToggle: () => void }> = ({ theme, onToggle }) => {
    const label = theme === 'light' ? "Switch to dark mode" : "Switch to light mode";
    return (
        <button
            onClick={onToggle}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
            aria-label={label}
        >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
    );
}

const App: React.FC = () => {
    const [error, setError] = useState<string | null>(null);

    const getInitialDayIndex = (): number => {
        try {
            const today = new Date().getDay();
            return DATE_DAY_TO_ORDER_INDEX[today] ?? 0;
        } catch (e) {
            console.error("Error calculating initial day:", e);
            return 0; // Fallback gracefully
        }
    };

    const [currentDayIndex, setCurrentDayIndex] = useState<number>(getInitialDayIndex);
    const [language, setLanguage] = useState<Language>('en');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [isDaySelectorOpen, setIsDaySelectorOpen] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
    const [theme, setTheme] = useState<Theme>('light');

    // Load state from localStorage on initial render
    useEffect(() => {
        let initError: string | null = null;
        // Load Favorites
        try {
            const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
            if (storedFavorites) setFavorites(new Set(JSON.parse(storedFavorites)));
        } catch (err) {
            console.error('Error reading favorites from localStorage', err);
            initError = 'Could not load your saved favorites.';
        }

        // Load Settings
        try {
            const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                setSettings({ ...defaultSettings, ...parsed, translationFontSize: parsed.translationFontSize ?? defaultSettings.translationFontSize });
            }
        } catch (err) {
            console.error('Error reading settings from localStorage', err);
            if (!initError) initError = 'Could not load your settings.';
        }

        // Load Theme
        try {
            const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            if (storedTheme === 'dark' || storedTheme === 'light') {
                setTheme(storedTheme);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTheme('dark');
            }
        } catch (err) {
            console.error('Error reading theme from localStorage', err);
            if (!initError) initError = 'Could not load your theme preference.';
        }
        if (initError) setError(initError);
    }, []);

    // Refs for pinch-zoom
    const pinchStartDist = useRef<number>(0);
    const pinchStartFontSize = useRef<number>(settings.arabicFontSize);
    
    // Save favorites to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites)));
        } catch (err) {
            console.error('Error saving favorites to localStorage', err);
            setError('Could not save favorites. Your browser storage might be full or in private mode.');
        }
    }, [favorites]);

    // Save settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (err) {
            console.error('Error saving settings to localStorage', err);
            setError('Could not save settings. Your browser storage might be full or in private mode.');
        }
    }, [settings]);

    // Apply and save theme
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (err) {
            console.error('Error saving theme to localStorage', err);
            setError('Could not save theme preference. Your browser storage might be full or in private mode.');
        }
    }, [theme]);

    const handleSettingsChange = (newSettings: Partial<AppSettings>) => {
        setSettings((prev: AppSettings) => ({ ...prev, ...newSettings }));
    };

    const toggleTheme = useCallback(() => {
        setTheme((prevTheme: Theme) => prevTheme === 'light' ? 'dark' : 'light');
    }, []);
    
    const handleNextDay = useCallback(() => {
        setCurrentDayIndex((prevIndex: number) => (prevIndex + 1) % DAYS_ORDER.length);
    }, []);

    const handlePrevDay = useCallback(() => {
        setCurrentDayIndex((prevIndex: number) => (prevIndex - 1 + DAYS_ORDER.length) % DAYS_ORDER.length);
    }, []);

    const handleSelectDay = (index: number) => {
        setCurrentDayIndex(index);
        setIsDaySelectorOpen(false);
    };

    const toggleFavorite = useCallback((duaId: string) => {
        setFavorites((prevFavorites: Set<string>) => {
            const newFavorites = new Set(prevFavorites);
            if (newFavorites.has(duaId)) {
                newFavorites.delete(duaId);
            } else {
                newFavorites.add(duaId);
            }
            return newFavorites;
        });
    }, []);

    const swipeHandlers = useSwipe({
        onSwipedLeft: handleNextDay,
        onSwipedRight: handlePrevDay,
    });

    // Pinch-to-zoom handlers
    const getDistance = (touches: React.TouchList) => {
        const [touch1, touch2] = [touches[0], touches[1]];
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    };
    
    const onTouchStart = (e: React.TouchEvent) => {
        swipeHandlers.onTouchStart(e); // Keep swipe functionality
        if (e.touches.length === 2) {
            pinchStartDist.current = getDistance(e.touches);
            pinchStartFontSize.current = settings.arabicFontSize;
        }
    };
    
    const onTouchMove = (e: React.TouchEvent) => {
        swipeHandlers.onTouchMove(e); // Keep swipe functionality
        if (e.touches.length === 2) {
            const currentDist = getDistance(e.touches);
            const scale = currentDist / pinchStartDist.current;
            const newSize = pinchStartFontSize.current * scale;
            // Clamp font size between min and max values
            const clampedSize = Math.max(1.25, Math.min(3, newSize));
            handleSettingsChange({ arabicFontSize: clampedSize });
        }
    };

    const currentCollection = useMemo(() => {
        if (!DUA_DATA || DUA_DATA.length === 0) return null;
        if (currentDayIndex < 0 || currentDayIndex >= DUA_DATA.length) {
            console.error(`Invalid day index: ${currentDayIndex}. Falling back to index 0.`);
            return DUA_DATA[0];
        }
        return DUA_DATA[currentDayIndex];
    }, [currentDayIndex]);

    useEffect(() => {
        if (!currentCollection) {
            setError("Failed to load prayers. The application data may be missing. Please try refreshing the page.");
        }
    }, [currentCollection]);

    return (
        <div className="app-container bg-slate-100 dark:bg-slate-900" style={{ '--arabic-font-size': `${settings.arabicFontSize}rem` } as React.CSSProperties}>
            {error && <ErrorDisplay message={error} onDismiss={() => setError(null)} />}
            
            <header className="flex justify-between items-center p-4 w-full max-w-3xl mx-auto gap-4">
                <h1 className="text-4xl font-amiri font-bold text-slate-800 dark:text-slate-100 flex-shrink-0">
                    Daily <span className="text-teal-600 dark:text-teal-400">Dua</span>
                </h1>
                <div className="flex items-center justify-end flex-wrap-reverse gap-1">
                    <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors" aria-label="Open settings">
                        <SettingsIcon />
                    </button>
                    <button onClick={() => setIsAboutOpen(true)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors" aria-label="About this app">
                        <InformationCircleIcon />
                    </button>
                    <TranslationToggleButton isVisible={settings.showTranslation} onToggle={() => handleSettingsChange({ showTranslation: !settings.showTranslation })} />
                    <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
                </div>
            </header>

            <main className="flex-grow flex flex-col" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={swipeHandlers.onTouchEnd}>
                {!currentCollection ? (
                    <div className="flex-grow flex items-center justify-center p-4">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Failed to Load Content</h2>
                            <p className="text-slate-600 dark:text-slate-300 mt-2">
                                There was a problem loading the prayers for the selected day. Please refresh the page.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-full max-w-3xl mx-auto">
                            <DayNavigator
                                dayName={currentCollection.name[language]}
                                onPrev={handlePrevDay}
                                onNext={handleNextDay}
                                onDayNameClick={() => setIsDaySelectorOpen(true)}
                            />
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <DuaCard 
                                collection={currentCollection} 
                                language={language}
                                favorites={favorites}
                                onToggleFavorite={toggleFavorite}
                                showTranslation={settings.showTranslation}
                                showFavorites={settings.showFavorites}
                                showShare={settings.showShare}
                                translationFontSize={settings.translationFontSize}
                            />
                        </div>
                    </>
                )}
            </main>
            
            <DaySelectorModal 
                isOpen={isDaySelectorOpen}
                onClose={() => setIsDaySelectorOpen(false)}
                onSelectDay={handleSelectDay}
                days={DUA_DATA.map(d => d.name[language])}
                currentIndex={currentDayIndex}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSettingsChange={handleSettingsChange}
            />
            
            <AboutModal
                isOpen={isAboutOpen}
                onClose={() => setIsAboutOpen(false)}
                language={language}
            />

            <footer className="text-center p-4 text-xs text-slate-400 dark:text-slate-500">
                <p>Swipe left or right to navigate. Pinch to zoom text.</p>
                <p>Created with focus and tranquility in mind.</p>
            </footer>
        </div>
    );
};

export default App;