import { Language } from "../types";
import { UI } from "../lib/ui";
import { Icon, IconName } from "./icons";
export type BottomTab = "duas" | "favorites" | "days" | "settings";
const tabs: { id: BottomTab; icon: IconName }[] = [
  { id: "duas", icon: "book" },
  { id: "favorites", icon: "star" },
  { id: "days", icon: "calendar" },
  { id: "settings", icon: "settings" },
];
export function BottomNav({
  activeTab,
  onTabChange,
  language,
}: {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  language: Language;
}) {
  const t = UI[language];
  return (
    <nav
      className="bottom-nav"
      aria-label={t.navigation}
      data-dialog-background
    >
      {tabs.map(({ id, icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          aria-label={t[id]}
          aria-current={activeTab === id ? "page" : undefined}
        >
          <Icon name={icon} />
          <span>{t[id]}</span>
        </button>
      ))}
    </nav>
  );
}
