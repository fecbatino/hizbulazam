import { Language } from "../types";
import { UI } from "../lib/ui";
import { Icon } from "./icons";
interface Props {
  dayName: string;
  dayNameAr?: string;
  onPrev: () => void;
  onNext: () => void;
  onDayNameClick: () => void;
  currentDayIndex: number;
  totalDays: number;
  language: Language;
  currentDua: number;
  totalDuas: number;
}
export function DayNavigator({
  dayName,
  dayNameAr,
  onPrev,
  onNext,
  onDayNameClick,
  currentDayIndex,
  totalDays,
  language,
  currentDua,
  totalDuas,
}: Props) {
  const t = UI[language];
  return (
    <section
      className="day-navigator"
      aria-label={t.days}
      data-dialog-background
    >
      <button className="icon-button" onClick={onPrev} aria-label={t.previous}>
        <Icon name="left" />
      </button>
      <button
        className="day-heading"
        onClick={onDayNameClick}
        aria-label={`${t.chooseDay}: ${dayName}`}
        aria-haspopup="dialog"
      >
        <span className="day-title">
          {dayName} <Icon name="down" />
        </span>
        <span className="day-subtitle">
          <span>
            {t.progress} {currentDua} {t.of} {totalDuas}
          </span>
          {dayNameAr && (
            <span lang="ar" dir="rtl">
              {dayNameAr}
            </span>
          )}
        </span>
        <span className="day-dots" aria-hidden="true">
          {Array.from({ length: totalDays }, (_, i) => (
            <span key={i} className={i === currentDayIndex ? "selected" : ""} />
          ))}
        </span>
      </button>
      <button className="icon-button" onClick={onNext} aria-label={t.next}>
        <Icon name="right" />
      </button>
    </section>
  );
}
