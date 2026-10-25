import React, { useState } from "react";
import { DuaCollection, DuaItem, Language } from "../types";
import { HiddenDuas, isHidden } from "../lib/hidden";
import { SOURCE_LABEL, UI } from "../lib/ui";
import { Icon } from "./icons";
interface Props {
  collection: DuaCollection;
  language: Language;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  showTranslation: boolean;
  showFavorites: boolean;
  showShare: boolean;
  translationFontSize: number;
  showProgress?: boolean;
  /** Position of each dua within its full day, when only a subset is shown. */
  numbering?: Map<string, number>;
  total?: number;
  /** Shows a button that opens the dua at its place in the day. */
  onOpen?: (id: string) => void;
  /** Hidden duas render as a slim line that can be shown again. */
  hidden?: HiddenDuas;
  onHide?: (id: string) => void;
  onShow?: (dua: DuaItem) => void;
}
function Entry({
  dua,
  index,
  total,
  language,
  favorite,
  onToggleFavorite,
  showTranslation,
  showFavorites,
  showShare,
  translationFontSize,
  showProgress,
  onOpen,
  onHide,
  onShow,
  isDuaHidden,
}: Omit<
  Props,
  "collection" | "favorites" | "numbering" | "total" | "hidden"
> & {
  dua: DuaItem;
  index: number;
  total: number;
  favorite: boolean;
  isDuaHidden: boolean;
}) {
  const [status, setStatus] = useState("");
  const t = UI[language];
  const number = showProgress && (
    <span className="dua-number">
      {t.progress} {index + 1} {t.of} {total}
    </span>
  );
  const badge = (
    <span className="source-badge">
      {SOURCE_LABEL[language][dua.source_type]}
    </span>
  );
  if (isDuaHidden)
    // Stays in the list with its id, so position, numbering and deep links
    // keep working; the content itself is not rendered.
    return (
      <article
        id={"dua-" + dua.id}
        data-dua-id={dua.id}
        className="dua-card is-hidden"
      >
        <div className="dua-card-labels">
          {number}
          {badge}
          {/* The dashed line shows it visually; screen readers get the word. */}
          <span className="sr-only">{t.hiddenLabel}</span>
        </div>
        {onShow && (
          <button
            className="text-button"
            onClick={() => onShow(dua)}
            aria-label={`${t.show}: ${t.progress} ${index + 1}`}
          >
            <Icon name="eye" />
            {t.show}
          </button>
        )}
      </article>
    );
  const translation =
    language === "de"
      ? dua.translation_de
      : language === "fr"
        ? dua.translation_fr
        : dua.translation_en;
  const context =
    language === "de"
      ? dua.source_context_de
      : language === "fr"
        ? dua.source_context_fr
        : dua.source_context_en;
  const reference = dua.primary_sources
    ?.map((s) => s.book + " " + s.ref)
    .join(", ");
  const share = async () => {
    const url = new URL(location.href);
    url.hash = "/dua/" + encodeURIComponent(dua.id);
    const text =
      dua.arabic_text +
      (translation ? "\n\n" + translation : "") +
      "\n\n" +
      context;
    try {
      if (navigator.share) await navigator.share({ text, url: url.href });
      else {
        await navigator.clipboard.writeText(text + "\n\n" + url.href);
        setStatus(t.copied);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setStatus(t.copyError);
    }
  };
  return (
    <article id={"dua-" + dua.id} data-dua-id={dua.id} className="dua-card">
      <header className="dua-card-header">
        <div className="dua-card-labels">
          {number}
          {badge}
        </div>
        <div className="dua-actions">
          {showFavorites && (
            <button
              className={"icon-button" + (favorite ? " is-favorite" : "")}
              onClick={() => onToggleFavorite(dua.id)}
              aria-label={favorite ? t.removeFavorite : t.addFavorite}
              aria-pressed={favorite}
            >
              <Icon name="star" filled={favorite} />
            </button>
          )}
          {showShare && (
            <button
              className="icon-button"
              onClick={() => void share()}
              aria-label={t.share}
            >
              <Icon name="share" />
            </button>
          )}
          {onOpen && (
            <button
              className="icon-button"
              onClick={() => onOpen(dua.id)}
              aria-label={t.openInDay}
            >
              <Icon name="right" />
            </button>
          )}
          {onHide && (
            <button
              className="icon-button"
              onClick={() => onHide(dua.id)}
              aria-label={t.hide}
            >
              <Icon name="eyeOff" />
            </button>
          )}
        </div>
      </header>
      <p className="arabic-text" lang="ar" dir="rtl">
        {dua.arabic_text}
      </p>
      {showTranslation && translation && (
        <p
          className="translation-text"
          lang={language}
          style={{ fontSize: translationFontSize + "rem" }}
        >
          {translation}
        </p>
      )}
      <p className="dua-source">
        {reference ? reference + " · " : ""}
        {context}
      </p>
      {status && (
        <span className="share-status" role="status">
          {status}
        </span>
      )}
    </article>
  );
}
export const DuaCard = React.memo<Props>(function DuaCard({
  collection,
  favorites,
  showProgress = true,
  numbering,
  total,
  hidden,
  ...props
}) {
  return (
    <div className="dua-list">
      {collection.duas.map((dua, index) => (
        <Entry
          key={dua.id}
          dua={dua}
          index={numbering?.get(dua.id) ?? index}
          total={total ?? collection.duas.length}
          favorite={favorites.has(dua.id)}
          showProgress={showProgress}
          isDuaHidden={!!hidden && isHidden(hidden, dua)}
          {...props}
        />
      ))}
    </div>
  );
});
