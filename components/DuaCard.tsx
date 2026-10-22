import React, { useState } from "react";
import { DuaCollection, DuaItem, Language, SourceType } from "../types";
import { UI } from "../lib/ui";
import { Icon } from "./icons";
const BADGE: Record<Language, Record<SourceType, string>> = {
  en: {
    quran: "Quran",
    sahih_hadith: "Sahih Hadith",
    hasan_hadith: "Hasan Hadith",
    weak_hadith: "Weak Hadith",
    ikhtilaf: "Ikhtilaf",
    later_supplication: "Later Supplication",
    unknown: "Unknown",
  },
  de: {
    quran: "Quran",
    sahih_hadith: "Sahih Hadith",
    hasan_hadith: "Hasan Hadith",
    weak_hadith: "Schwaches Hadith",
    ikhtilaf: "Ikhtilaf",
    later_supplication: "Späteres Gebet",
    unknown: "Unbekannt",
  },
  fr: {
    quran: "Coran",
    sahih_hadith: "Hadith Sahih",
    hasan_hadith: "Hadith Hasan",
    weak_hadith: "Hadith Faible",
    ikhtilaf: "Ikhtilaf",
    later_supplication: "Supplication Tardive",
    unknown: "Inconnu",
  },
  ar: {
    quran: "قرآن",
    sahih_hadith: "حديث صحيح",
    hasan_hadith: "حديث حسن",
    weak_hadith: "حديث ضعيف",
    ikhtilaf: "اختلاف",
    later_supplication: "دعاء متأخر",
    unknown: "غير معروف",
  },
};
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
}: Omit<Props, "collection" | "favorites"> & {
  dua: DuaItem;
  index: number;
  total: number;
  favorite: boolean;
}) {
  const [status, setStatus] = useState("");
  const t = UI[language];
  const translation =
    language === "de"
      ? dua.translation_de
      : language === "fr"
        ? dua.translation_fr
        : language === "ar"
          ? ""
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
          {showProgress && (
            <span className="dua-number">
              {t.progress} {index + 1} {t.of} {total}
            </span>
          )}
          <span className="source-badge">
            {BADGE[language][dua.source_type]}
          </span>
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
  ...props
}) {
  return (
    <div className="dua-list">
      {collection.duas.map((dua, index) => (
        <Entry
          key={dua.id}
          dua={dua}
          index={index}
          total={collection.duas.length}
          favorite={favorites.has(dua.id)}
          showProgress={showProgress}
          {...props}
        />
      ))}
    </div>
  );
});
