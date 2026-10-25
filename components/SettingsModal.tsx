import { Language, SourceType } from "../types";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { HiddenDuas, SOURCE_TYPES } from "../lib/hidden";
import { SOURCE_LABEL, UI } from "../lib/ui";
import { Icon } from "./icons";
import { OfflineDownload } from "./OfflineDownload";
export interface AppSettings {
  showFavorites: boolean;
  showShare: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  showTranslation: boolean;
}
export type Theme = "light" | "dark" | "system";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  hidden: HiddenDuas;
  onHiddenTypeChange: (type: SourceType, hide: boolean) => void;
  onShowAll: () => void;
  language: Language;
}
const SETTINGS_T = {
  en: {
    title: "Settings",
    showFavorites: "Show Favorite Buttons",
    showShare: "Show Share Buttons",
    showTranslation: "Show Translation",
    arabicFont: "Arabic Font Size",
    translationFont: "Translation Font Size",
  },
  de: {
    title: "Einstellungen",
    showFavorites: "Favoriten-Buttons anzeigen",
    showShare: "Teilen-Buttons anzeigen",
    showTranslation: "Übersetzung anzeigen",
    arabicFont: "Arabische Schriftgröße",
    translationFont: "Übersetzungsschriftgröße",
  },
  fr: {
    title: "Paramètres",
    showFavorites: "Afficher les boutons de favoris",
    showShare: "Afficher les boutons de partage",
    showTranslation: "Afficher la traduction",
    arabicFont: "Taille de police arabe",
    translationFont: "Taille de police de traduction",
  },
};
export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  theme,
  onThemeChange,
  hidden,
  onHiddenTypeChange,
  onShowAll,
  language,
}: Props) {
  const ref = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const t = SETTINGS_T[language],
    ui = UI[language];
  if (!isOpen) return null;
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-panel"
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="settings-title">{t.title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={ui.close}
          >
            <Icon name="close" />
          </button>
        </div>
        {(["showFavorites", "showShare", "showTranslation"] as const)
          .map((key) => (
            <label className="setting-toggle" key={key}>
              <span>{t[key]}</span>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => onSettingsChange({ [key]: e.target.checked })}
              />
            </label>
          ))}
        <fieldset className="theme-choice">
          <legend>{ui.theme}</legend>
          {(
            [
              ["light", ui.light],
              ["dark", ui.dark],
              ["system", ui.system],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => onThemeChange(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <label className="font-setting" htmlFor="font-size-slider">
          {t.arabicFont}
          <span className="font-value" aria-hidden="true">
            {Math.round((settings.arabicFontSize / 1.9) * 100)}%
          </span>
          <input
            id="font-size-slider"
            aria-label={t.arabicFont}
            type="range"
            min="1.25"
            max="3"
            step="0.05"
            value={settings.arabicFontSize}
            onChange={(e) =>
              onSettingsChange({ arabicFontSize: Number(e.target.value) })
            }
          />
        </label>
        <label className="font-setting" htmlFor="translation-font-size-slider">
          {t.translationFont}
          <span className="font-value" aria-hidden="true">
            {Math.round(settings.translationFontSize * 100)}%
          </span>
          <input
            id="translation-font-size-slider"
            aria-label={t.translationFont}
            type="range"
            min="0.8"
            max="1.75"
            step="0.05"
            value={settings.translationFontSize}
            onChange={(e) =>
              onSettingsChange({ translationFontSize: Number(e.target.value) })
            }
          />
        </label>
        <fieldset className="hidden-settings">
          <legend>{ui.hiddenTitle}</legend>
          <p>{ui.hiddenHint}</p>
          <p className="hidden-subtitle">{ui.hideBySource}</p>
          {/* "unknown" does not occur in the collection. */}
          {SOURCE_TYPES.filter((type) => type !== "unknown").map((type) => (
            <label className="setting-toggle" key={type}>
              <span>{SOURCE_LABEL[language][type]}</span>
              <input
                type="checkbox"
                checked={hidden.types.includes(type)}
                onChange={(e) => onHiddenTypeChange(type, e.target.checked)}
              />
            </label>
          ))}
          <p className="hidden-count">
            {ui.hiddenSingle.replace("{n}", String(hidden.ids.length))}
          </p>
          <button
            className="primary-button"
            onClick={onShowAll}
            disabled={
              !hidden.ids.length && !hidden.types.length && !hidden.shown.length
            }
          >
            <Icon name="eye" />
            {ui.showAll}
          </button>
        </fieldset>
        <OfflineDownload language={language} />
      </div>
    </div>
  );
}
