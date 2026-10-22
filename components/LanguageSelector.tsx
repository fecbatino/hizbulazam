import { Language } from "../types";
import { UI } from "../lib/ui";
export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
}: {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}) {
  return (
    <select
      className="language-select"
      aria-label={UI[currentLanguage].language}
      value={currentLanguage}
      onChange={(e) => onLanguageChange(e.target.value as Language)}
    >
      <option value="de">Deutsch</option>
      <option value="en">English</option>
      <option value="fr">Français</option>
    </select>
  );
}
