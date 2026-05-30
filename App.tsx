import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BottomNav, BottomTab } from './components/BottomNav';
import { DayNavigator } from './components/DayNavigator';
import { DuaCard } from './components/DuaCard';
import { LanguageSelector } from './components/LanguageSelector';
import { AppSettings } from './components/SettingsModal';
import { DATE_DAY_TO_ORDER_INDEX, DAYS_ORDER } from './constants';
import { DUA_DATA } from './hooks/duas';
import { useSwipe } from './hooks/useSwipe';
import { Language } from './types';

const DaySelectorModal = React.lazy(() =>
  import('./components/DaySelectorModal').then(module => ({ default: module.DaySelectorModal }))
);
const SettingsModal = React.lazy(() =>
  import('./components/SettingsModal').then(module => ({ default: module.SettingsModal }))
);

const FAVORITES_STORAGE_KEY = 'dailyDuaFavorites';
const SETTINGS_STORAGE_KEY = 'dailyDuaAppSettings';
const THEME_STORAGE_KEY = 'dailyDuaTheme';

type Theme = 'light' | 'dark';

const defaultSettings: AppSettings = {
  showFavorites: true,
  showShare: true,
  arabicFontSize: 1.9,
  translationFontSize: 1,
  showTranslation: true,
};

// ── Error Banner ──────────────────────────────────────────────────────────────
const ErrorDisplay: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-[100] flex items-start max-w-sm" role="alert">
    <div className="flex-grow">
      <p className="font-bold">Fehler</p>
      <p className="text-sm">{message}</p>
    </div>
    <button onClick={onDismiss} className="ml-4 p-1" aria-label="Schließen">✕</button>
  </div>
);

// ── Favorites View ────────────────────────────────────────────────────────────
const EMPTY_FAV: Record<Language, string> = {
  en: 'No favorites yet — tap the ☆ on any dua to save it.',
  de: 'Noch keine Favoriten — tippe auf ☆ bei einem Dua.',
  fr: 'Aucun favori encore — appuie sur ☆ sur un dua.',
  ar: 'لا توجد مفضلات بعد — اضغط على ☆ لحفظ دعاء.',
};

const FAV_TITLE: Record<Language, string> = {
  en: 'Favorites', de: 'Favoriten', fr: 'Favoris', ar: 'المفضلة',
};

const FavoritesView: React.FC<{
  favorites: Set<string>;
  language: Language;
  onToggleFavorite: (id: string) => void;
  showShare: boolean;
  translationFontSize: number;
  showTranslation: boolean;
}> = ({ favorites, language, onToggleFavorite, showShare, translationFontSize, showTranslation }) => {
  const favDuas = useMemo(
    () => DUA_DATA.flatMap(col => col.duas.filter(d => favorites.has(d.id))),
    [favorites]
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--hza-card)',
        borderBottom: '1px solid var(--hza-border)',
        padding: '14px 16px',
        textAlign: 'center',
        fontFamily: "'Playfair Display', serif",
        fontWeight: 600,
        fontSize: 18,
        color: 'var(--hza-text)',
      }}>
        {FAV_TITLE[language]}
      </div>

      {favDuas.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--hza-hint)', textAlign: 'center', lineHeight: 1.6 }}>
            {EMPTY_FAV[language]}
          </p>
        </div>
      ) : (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {favDuas.map(dua => {
            const translation = language === 'de' ? dua.translation_de : language === 'fr' ? dua.translation_fr : language === 'ar' ? '' : dua.translation_en;
            const sourceCtx = language === 'de' ? dua.source_context_de : language === 'fr' ? dua.source_context_fr : dua.source_context_en;
            const sourceRef = dua.primary_sources?.length ? dua.primary_sources.map(s => `${s.book} ${s.ref}`).join(', ') : '';
            const footerText = sourceRef ? `${sourceRef} · ${sourceCtx}` : sourceCtx;

            return (
              <article key={dua.id} style={{ background: 'var(--hza-card)', borderRadius: 16, border: '1px solid var(--hza-border)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '10px 14px 8px', borderBottom: '1px solid var(--hza-border)', gap: 8 }}>
                  <button
                    onClick={() => onToggleFavorite(dua.id)}
                    aria-label="Aus Favoriten entfernen"
                    style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--hza-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--hza-gold)' }}
                  >★</button>
                  {showShare && (
                    <button
                      onClick={async () => {
                        const text = `${dua.arabic_text}${translation ? `\n\n${translation}` : ''}\n\n${sourceCtx}`;
                        if (navigator.share) { try { await navigator.share({ text }); } catch {} }
                        else { try { await navigator.clipboard.writeText(text); alert('Kopiert!'); } catch {} }
                      }}
                      aria-label="Teilen"
                      style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--hza-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--hza-hint)' }}
                    >↗</button>
                  )}
                </div>
                <p lang="ar" dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 'var(--arabic-font-size, 1.9rem)', lineHeight: 2.2, textAlign: 'center', color: 'var(--hza-text)', padding: '16px 16px', margin: 0 }}>
                  {dua.arabic_text}
                </p>
                {showTranslation && language !== 'ar' && translation && (
                  <>
                    <div style={{ height: 1, background: 'var(--hza-border)', margin: '0 14px' }} />
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: `${translationFontSize}rem`, fontStyle: 'italic', color: 'var(--hza-muted)', padding: '12px 14px', lineHeight: 1.6, margin: 0 }}>
                      {translation}
                    </p>
                  </>
                )}
                {footerText && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px 12px' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--hza-green)', flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--hza-hint)', lineHeight: 1.4 }}>{footerText}</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Theme toggle button (styled for green header) ─────────────────────────────
const ThemeToggleButton: React.FC<{ theme: Theme; onToggle: () => void }> = ({ theme, onToggle }) => (
  <button
    onClick={onToggle}
    aria-label={theme === 'light' ? 'Dunkelmodus' : 'Hellmodus'}
    style={{
      background: 'rgba(0,0,0,0.2)',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: 8,
      padding: '7px 10px',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16,
    }}
  >
    {theme === 'light' ? '🌙' : '☀️'}
  </button>
);

// ── Pinch distance helper ─────────────────────────────────────────────────────
const getDistance = (touches: React.TouchList) => {
  const [t1, t2] = [touches[0], touches[1]];
  return Math.sqrt(Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2));
};

// ── App ───────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const getInitialDayIndex = (): number => {
    try { return DATE_DAY_TO_ORDER_INDEX[new Date().getDay()] ?? 0; }
    catch { return 0; }
  };

  const [currentDayIndex, setCurrentDayIndex] = useState<number>(getInitialDayIndex);
  const [language, setLanguage] = useState<Language>('de');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isDaySelectorOpen, setIsDaySelectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [activeView, setActiveView] = useState<'duas' | 'favorites'>('duas');

  // Load from localStorage
  useEffect(() => {
    let initError: string | null = null;
    try {
      const s = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (s) setFavorites(new Set(JSON.parse(s)));
    } catch { initError = 'Favoriten konnten nicht geladen werden.'; }

    try {
      const s = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        setSettings({ ...defaultSettings, ...parsed, translationFontSize: parsed.translationFontSize ?? defaultSettings.translationFontSize });
      }
    } catch { if (!initError) initError = 'Einstellungen konnten nicht geladen werden.'; }

    try {
      const s = localStorage.getItem(THEME_STORAGE_KEY);
      if (s === 'dark' || s === 'light') setTheme(s);
      else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) setTheme('dark');
    } catch { if (!initError) initError = 'Design-Einstellung konnte nicht geladen werden.'; }

    if (initError) setError(initError);
  }, []);

  const pinchStartDist = useRef(0);
  const pinchStartFontSize = useRef(settings.arabicFontSize);
  const pinchStartTranslationFontSize = useRef(settings.translationFontSize);

  useEffect(() => {
    try { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites))); }
    catch { setError('Favoriten konnten nicht gespeichert werden.'); }
  }, [favorites]);

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)); }
    catch { setError('Einstellungen konnten nicht gespeichert werden.'); }
  }, [settings]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); }
    catch { setError('Design-Einstellung konnte nicht gespeichert werden.'); }
  }, [theme]);

  useEffect(() => {
    const html = document.documentElement;
    if (language === 'ar') { html.setAttribute('lang', 'ar'); html.setAttribute('dir', 'rtl'); }
    else { html.setAttribute('lang', language); html.setAttribute('dir', 'ltr'); }
  }, [language]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isSettingsOpen) setIsSettingsOpen(false);
      else if (isDaySelectorOpen) setIsDaySelectorOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isDaySelectorOpen]);

  const handleSettingsChange = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), []);

  const handleNextDay = useCallback(() => setCurrentDayIndex(i => (i + 1) % DAYS_ORDER.length), []);
  const handlePrevDay = useCallback(() => setCurrentDayIndex(i => (i - 1 + DAYS_ORDER.length) % DAYS_ORDER.length), []);

  const handleSelectDay = (index: number) => {
    setCurrentDayIndex(index);
    setIsDaySelectorOpen(false);
  };

  const toggleFavorite = useCallback((duaId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(duaId)) next.delete(duaId); else next.add(duaId);
      return next;
    });
  }, []);

  const handleTabChange = useCallback((tab: BottomTab) => {
    if (tab === 'duas') setActiveView('duas');
    else if (tab === 'favorites') setActiveView('favorites');
    else if (tab === 'days') setIsDaySelectorOpen(true);
    else if (tab === 'settings') setIsSettingsOpen(true);
  }, []);

  const swipeHandlers = useSwipe({ onSwipedLeft: handleNextDay, onSwipedRight: handlePrevDay });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    swipeHandlers.onTouchStart(e);
    if (e.touches.length === 2) {
      pinchStartDist.current = getDistance(e.touches);
      pinchStartFontSize.current = settings.arabicFontSize;
      pinchStartTranslationFontSize.current = settings.translationFontSize;
    }
  }, [settings.arabicFontSize, settings.translationFontSize, swipeHandlers]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    swipeHandlers.onTouchMove(e);
    if (e.touches.length === 2) {
      const currentDist = getDistance(e.touches);
      const scale = currentDist / pinchStartDist.current;
      pinchStartDist.current = currentDist;
      setSettings(prev => ({
        ...prev,
        arabicFontSize: Math.max(1.25, Math.min(3, prev.arabicFontSize * scale)),
        translationFontSize: Math.max(0.75, Math.min(1.75, prev.translationFontSize * scale)),
      }));
    }
  }, [swipeHandlers]);

  const currentCollection = useMemo(() => {
    if (!DUA_DATA?.length) return null;
    return DUA_DATA[Math.max(0, Math.min(currentDayIndex, DUA_DATA.length - 1))];
  }, [currentDayIndex]);

  useEffect(() => {
    if (!currentCollection) setError('Inhalt konnte nicht geladen werden. Bitte neu laden.');
  }, [currentCollection]);

  const activeTab: BottomTab = activeView === 'favorites' ? 'favorites' : 'duas';

  return (
    <div
      className="app-container"
      style={{ '--arabic-font-size': `${settings.arabicFontSize}rem` } as React.CSSProperties}
    >
      {error && <ErrorDisplay message={error} onDismiss={() => setError(null)} />}

      {/* ── Header ── */}
      <header style={{
        background: 'var(--hza-green)',
        padding: '18px 20px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 19, color: '#fff', lineHeight: 1.1, letterSpacing: '0.01em' }}>
            Hizbul Azam
          </span>
          <span style={{ fontFamily: "'Amiri', serif", fontSize: 15, color: 'var(--hza-gold)', direction: 'rtl', lineHeight: 1.4 }}>
            حِزْبُ الأَعْظَم
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
          <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
        </div>
      </header>

      {/* ── Main content ── */}
      {activeView === 'duas' ? (
        <>
          {!currentCollection ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--hza-muted)', textAlign: 'center' }}>
                Inhalt konnte nicht geladen werden. Bitte neu laden.
              </p>
            </div>
          ) : (
            <>
              <DayNavigator
                dayName={currentCollection.name[language]}
                dayNameAr={language !== 'ar' ? currentCollection.name['ar'] : undefined}
                onPrev={handlePrevDay}
                onNext={handleNextDay}
                onDayNameClick={() => setIsDaySelectorOpen(true)}
                isRtl={language === 'ar'}
                currentDayIndex={currentDayIndex}
                totalDays={DUA_DATA.length}
              />
              <div
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={swipeHandlers.onTouchEnd}
              >
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
        </>
      ) : (
        <FavoritesView
          favorites={favorites}
          language={language}
          onToggleFavorite={toggleFavorite}
          showShare={settings.showShare}
          translationFontSize={settings.translationFontSize}
          showTranslation={settings.showTranslation}
        />
      )}

      {/* ── Bottom Nav ── */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} language={language} />

      {/* ── Modals ── */}
      <React.Suspense fallback={null}>
        <DaySelectorModal
          isOpen={isDaySelectorOpen}
          onClose={() => setIsDaySelectorOpen(false)}
          onSelectDay={handleSelectDay}
          days={DUA_DATA.map(d => d.name[language])}
          currentIndex={currentDayIndex}
          language={language}
        />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          language={language}
        />
      </React.Suspense>
    </div>
  );
};

export default App;
