import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BottomNav, BottomTab } from "./components/BottomNav";
import { DayNavigator } from "./components/DayNavigator";
import { DuaCard } from "./components/DuaCard";
import { LanguageSelector } from "./components/LanguageSelector";
import { Icon } from "./components/icons";
import { UpdateNotice } from "./components/UpdateNotice";
import type { AppSettings, Theme } from "./components/SettingsModal";
import { DATE_DAY_TO_ORDER_INDEX, DAYS_ORDER } from "./constants";
import {
  findDayByDuaId,
  loadAllDays,
  loadDay,
  peekDay,
  useCollectionsMeta,
} from "./hooks/useCollections";
import { setDayHash, setDuaHash, useDeepLink } from "./hooks/useDeepLink";
import { Jump, useReadingPosition } from "./hooks/useReadingPosition";
import { UI } from "./lib/ui";
import { DuaCollection, Language } from "./types";

const DaySelectorModal = React.lazy(() =>
  import("./components/DaySelectorModal").then((m) => ({
    default: m.DaySelectorModal,
  })),
);
const SettingsModal = React.lazy(() =>
  import("./components/SettingsModal").then((m) => ({
    default: m.SettingsModal,
  })),
);
const SearchModal = React.lazy(() =>
  import("./components/SearchModal").then((m) => ({ default: m.SearchModal })),
);
const FAVORITES_STORAGE_KEY = "dailyDuaFavorites",
  SETTINGS_STORAGE_KEY = "dailyDuaAppSettings",
  THEME_STORAGE_KEY = "dailyDuaTheme";
const defaultSettings: AppSettings = {
  showFavorites: true,
  showShare: true,
  arabicFontSize: 1.9,
  translationFontSize: 1,
  showTranslation: true,
};
function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function initialSettings(): AppSettings {
  const value = read<Partial<AppSettings>>(SETTINGS_STORAGE_KEY, {});
  const result = { ...defaultSettings };
  for (const key of ["showFavorites", "showShare", "showTranslation"] as const)
    if (typeof value[key] === "boolean") result[key] = value[key];
  for (const [key, min, max] of [
    ["arabicFontSize", 1.25, 3],
    ["translationFontSize", 0.8, 1.75],
  ] as const) {
    if (typeof value[key] === "number" && Number.isFinite(value[key]))
      result[key] = Math.max(min, Math.min(max, value[key]!));
  }
  return result;
}
function App() {
  const { meta, error: metaError, retry: retryMeta } = useCollectionsMeta();
  const deepLink = useDeepLink();
  const [error, setError] = useState<string | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(
    () => DATE_DAY_TO_ORDER_INDEX[new Date().getDay()] ?? 0,
  );
  const [collection, setCollection] = useState<DuaCollection | null>(null);
  const [collectionError, setCollectionError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [allDays, setAllDays] = useState<DuaCollection[] | null>(null);
  const [favoritesError, setFavoritesError] = useState(false);
  const [favoritesRetry, setFavoritesRetry] = useState(0);
  const [pendingDua, setPendingDua] = useState<string | null>(null);
  const [jump, setJump] = useState<Jump>(null);
  const [linkResolved, setLinkResolved] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [language, setLanguage] = useState<Language>(() => {
    const stored = read<Language | null>("hzaLanguage", null);
    // Older releases could store "ar"; only known values are accepted.
    if (stored && ["de", "en", "fr"].includes(stored)) return stored;
    // Without a saved choice the device language decides. German stays the
    // fallback because the collection was introduced in German.
    const device = (
      navigator.languages?.[0] ||
      navigator.language ||
      ""
    ).toLowerCase();
    if (device.startsWith("fr")) return "fr";
    if (device.startsWith("en")) return "en";
    return "de";
  });
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const values = read<unknown>(FAVORITES_STORAGE_KEY, []);
    return new Set(
      Array.isArray(values)
        ? values.filter((id): id is string => typeof id === "string")
        : [],
    );
  });
  const [settings, setSettings] = useState(initialSettings);
  const [theme, setTheme] = useState<Theme>(() => {
    const value = read<string>(THEME_STORAGE_KEY, "");
    // Older releases stored the theme as a raw string, rather than JSON.
    let legacy = "";
    try {
      legacy = localStorage.getItem(THEME_STORAGE_KEY) || "";
    } catch {}
    for (const option of ["dark", "light", "system"] as const)
      if (value === option || legacy === option) return option;
    return "system";
  });
  const [systemDark, setSystemDark] = useState(
    () => !!window.matchMedia?.("(prefers-color-scheme: dark)").matches,
  );
  const resolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;
  const [activeView, setActiveView] = useState<"duas" | "favorites">("duas");
  const [isDaySelectorOpen, setIsDaySelectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const paused = isDaySelectorOpen || isSettingsOpen || isSearchOpen;
  const day = meta?.[currentDayIndex]?.day;
  // A day loaded before renders at once, without a loading frame in between.
  const shown =
    collection?.day === day ? collection : day ? (peekDay(day) ?? null) : null;
  const ready = !!shown;
  const { currentDua, savePosition } = useReadingPosition(
    day,
    ready,
    activeView === "duas",
    paused,
    jump,
  );
  const t = UI[language];
  const favoriteDays = useMemo(
    () =>
      (allDays ?? [])
        .map((entry) => ({
          ...entry,
          duas: entry.duas.filter((dua) => favorites.has(dua.id)),
          numbering: new Map(entry.duas.map((dua, i) => [dua.id, i])),
          total: entry.duas.length,
        }))
        .filter((entry) => entry.duas.length),
    [allDays, favorites],
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify([...favorites]),
      );
    } catch {
      setError(UI[language].error);
    }
  }, [favorites, language]);
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      setError(UI[language].error);
    }
  }, [settings, language]);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return;
    const change = () => setSystemDark(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#141E19" : "#1B4332",
      );
  }, [resolvedTheme]);
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      setError(UI[language].error);
    }
  }, [theme, language]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    try {
      localStorage.setItem("hzaLanguage", JSON.stringify(language));
    } catch {
      /* Language still works without persistence. */
    }
  }, [language]);
  useEffect(() => {
    const online = () => setIsOffline(false),
      offline = () => setIsOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);
  useEffect(() => {
    if (!day || !linkResolved) return;
    let alive = true;
    setCollectionError(false);
    loadDay(day)
      .then((next) => {
        if (alive) setCollection(next);
      })
      .catch(() => {
        if (alive) setCollectionError(true);
      });
    return () => {
      alive = false;
    };
  }, [day, linkResolved, retry]);
  useEffect(() => {
    if (!meta) return;
    if (deepLink?.kind === "day") {
      const index = meta.findIndex((entry) => entry.day === deepLink.day);
      if (index >= 0) {
        setCurrentDayIndex(index);
        setPendingDua(null);
        setJump(null);
        setActiveView("duas");
      }
    } else if (deepLink?.kind === "dua") {
      const entry = findDayByDuaId(meta, deepLink.id);
      if (entry) {
        setCurrentDayIndex(meta.indexOf(entry));
        setPendingDua(deepLink.id);
        setJump((previous) => ({
          id: deepLink.id,
          sequence: (previous?.sequence ?? 0) + 1,
        }));
        setActiveView("duas");
      }
    }
    setLinkResolved(true);
  }, [meta, deepLink]);
  useEffect(() => {
    if (day && linkResolved && !pendingDua) setDayHash(day);
  }, [day, linkResolved, pendingDua]);
  useEffect(() => {
    if (activeView !== "favorites" || allDays || !meta) return;
    let alive = true;
    setFavoritesError(false);
    loadAllDays(meta)
      .then((days) => {
        if (alive) setAllDays(days);
      })
      .catch(() => {
        if (alive) setFavoritesError(true);
      });
    return () => {
      alive = false;
    };
  }, [activeView, allDays, meta, favoritesRetry]);

  const changeSettings = useCallback(
    (value: Partial<AppSettings>) =>
      setSettings((previous) => ({ ...previous, ...value })),
    [],
  );
  const toggleFavorite = useCallback(
    (id: string) =>
      setFavorites((previous) => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );
  const selectDay = (index: number) => {
    savePosition();
    setPendingDua(null);
    setJump(null);
    setCurrentDayIndex(index);
    setActiveView("duas");
    setIsDaySelectorOpen(false);
  };
  const changeTab = (tab: BottomTab) => {
    savePosition();
    if (tab === "duas" || tab === "favorites") setActiveView(tab);
    else if (tab === "days") setIsDaySelectorOpen(true);
    else setIsSettingsOpen(true);
  };
  const searchSelect = (selectedDay: string, id: string) => {
    const index = meta?.findIndex((entry) => entry.day === selectedDay) ?? -1;
    if (index < 0) return;
    setCurrentDayIndex(index);
    setPendingDua(id);
    setJump((previous) => ({ id, sequence: (previous?.sequence ?? 0) + 1 }));
    setActiveView("duas");
    setDuaHash(id);
  };
  const openDaySelector = () => {
    savePosition();
    setIsDaySelectorOpen(true);
  };
  const restart = () => {
    savePosition();
    const id = shown?.duas[0]?.id;
    if (id)
      setJump((previous) => ({ id, sequence: (previous?.sequence ?? 0) + 1 }));
    setPendingDua(null);
    setIsDaySelectorOpen(false);
  };
  const cardProps = {
    language,
    favorites,
    onToggleFavorite: toggleFavorite,
    showTranslation: settings.showTranslation,
    showFavorites: settings.showFavorites,
    showShare: settings.showShare,
    translationFontSize: settings.translationFontSize,
  };
  const retryButton = (action: () => void) => (
    <div className="empty-state" role="alert">
      <p>{t.loadError}</p>
      <button onClick={action}>{t.retry}</button>
    </div>
  );
  return (
    <div
      className="app-container"
      style={
        {
          "--arabic-font-size": settings.arabicFontSize + "rem",
        } as React.CSSProperties
      }
    >
      {error && (
        <div className="offline-banner" role="alert">
          {error}
          <button
            className="icon-button"
            onClick={() => setError(null)}
            aria-label={t.close}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      {isOffline && (
        <div className="offline-banner" role="status">
          {t.offline}
        </div>
      )}
      <header className="app-header" data-dialog-background>
        <div className="brand">
          <span className="brand-title">Hizbul Azam</span>
          <span className="brand-arabic" lang="ar" dir="rtl">
            حِزْبُ الأَعْظَم
          </span>
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => {
              savePosition();
              setIsSearchOpen(true);
            }}
            aria-label={t.search}
            aria-haspopup="dialog"
          >
            <Icon name="search" />
          </button>
          <button
            className="icon-button"
            onClick={() =>
              setTheme(resolvedTheme === "light" ? "dark" : "light")
            }
            aria-label={resolvedTheme === "light" ? t.dark : t.light}
          >
            <Icon name={resolvedTheme === "light" ? "moon" : "sun"} />
          </button>
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={(next) => {
              savePosition();
              setLanguage(next);
            }}
          />
        </div>
      </header>
      {activeView === "duas" && meta && (
        <DayNavigator
          dayName={meta[currentDayIndex].name[language]}
          dayNameAr={meta[currentDayIndex].name.ar}
          onPrev={() =>
            selectDay(
              (currentDayIndex - 1 + (meta.length || DAYS_ORDER.length)) %
                meta.length,
            )
          }
          onNext={() => selectDay((currentDayIndex + 1) % meta.length)}
          onDayNameClick={openDaySelector}
          currentDayIndex={currentDayIndex}
          totalDays={meta.length}
          language={language}
          currentDua={currentDua}
          totalDuas={meta[currentDayIndex].count}
        />
      )}
      <main
        className="reading-content"
        data-dialog-background
        aria-busy={
          activeView === "duas" && !ready && !collectionError && !metaError
        }
      >
        {activeView === "duas" ? (
          metaError ? (
            retryButton(retryMeta)
          ) : collectionError ? (
            retryButton(() => setRetry((n) => n + 1))
          ) : shown ? (
            <DuaCard collection={shown} {...cardProps} />
          ) : (
            <p className="empty-state" role="status">
              {t.loading}
            </p>
          )
        ) : (
          <>
            <h1 className="view-title">{t.favorites}</h1>
            {favoritesError ? (
              retryButton(() => setFavoritesRetry((n) => n + 1))
            ) : !allDays ? (
              <p className="empty-state" role="status">
                {t.loading}
              </p>
            ) : !favoriteDays.length ? (
              <p className="empty-state">{t.emptyFavorites}</p>
            ) : (
              favoriteDays.map(({ numbering, total, ...entry }) => (
                <section
                  key={entry.day}
                  aria-labelledby={"favorites-" + entry.day}
                >
                  <h2 className="favorites-day" id={"favorites-" + entry.day}>
                    {entry.name[language]}
                  </h2>
                  <DuaCard
                    collection={entry}
                    {...cardProps}
                    showFavorites
                    numbering={numbering}
                    total={total}
                    onOpen={(id) => searchSelect(entry.day, id)}
                  />
                </section>
              ))
            )}
          </>
        )}
      </main>
      <BottomNav
        activeTab={activeView}
        onTabChange={changeTab}
        language={language}
      />
      <UpdateNotice language={language} onBeforeUpdate={savePosition} />
      <React.Suspense fallback={null}>
        {isDaySelectorOpen && (
          <DaySelectorModal
            isOpen
            onClose={() => setIsDaySelectorOpen(false)}
            onSelectDay={selectDay}
            onRestart={restart}
            days={(meta ?? []).map((entry) => entry.name[language])}
            currentIndex={currentDayIndex}
            language={language}
          />
        )}
        {isSettingsOpen && (
          <SettingsModal
            isOpen
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSettingsChange={changeSettings}
            theme={theme}
            onThemeChange={setTheme}
            language={language}
          />
        )}
        {isSearchOpen && (
          <SearchModal
            isOpen
            onClose={() => setIsSearchOpen(false)}
            language={language}
            onSelect={searchSelect}
          />
        )}
      </React.Suspense>
    </div>
  );
}
export default App;
