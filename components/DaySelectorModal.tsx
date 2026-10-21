import { Language } from "../types";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { UI } from "../lib/ui";
import { Icon } from "./icons";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectDay: (index: number) => void;
  onRestart: () => void;
  days: string[];
  currentIndex: number;
  language: Language;
}
export function DaySelectorModal({
  isOpen,
  onClose,
  onSelectDay,
  onRestart,
  days,
  currentIndex,
  language,
}: Props) {
  const ref = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const t = UI[language];
  if (!isOpen) return null;
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-panel"
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="days-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="days-title">{t.chooseDay}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={t.close}
          >
            <Icon name="close" />
          </button>
        </div>
        <button className="primary-button" onClick={onRestart}>
          {t.beginning}
        </button>
        <ul className="day-list">
          {days.map((day, index) => (
            <li key={day}>
              <button
                onClick={() => onSelectDay(index)}
                aria-current={currentIndex === index ? "date" : undefined}
              >
                {day}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
