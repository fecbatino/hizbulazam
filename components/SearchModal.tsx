import React, { useEffect, useMemo, useRef, useState } from "react";
import { Language } from "../types";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { normalize } from "../lib/normalize";
import { dataUrl } from "../lib/dataUrl";
import { UI } from "../lib/ui";
import { Icon } from "./icons";

interface SearchDoc {
  id: string;
  day: string;
  dayName: Record<Language, string>;
  ar: string;
  de: string;
  en: string;
  fr: string;
  ctx: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelect: (day: string, duaId: string) => void;
}

const TEXT = {
  de: {
    title: "Suche",
    placeholder: "Dua suchen — arabisch, deutsch, französisch …",
    empty: "Keine Treffer",
    hint: "Alle 140 Duas der Woche",
  },
  en: {
    title: "Search",
    placeholder: "Search dua — Arabic, English, French …",
    empty: "No matches",
    hint: "All 140 duas of the week",
  },
  fr: {
    title: "Recherche",
    placeholder: "Chercher une dua — arabe, français, allemand …",
    empty: "Aucun résultat",
    hint: "Les 140 duas de la semaine",
  },
  ar: {
    title: "بحث",
    placeholder: "ابحث في الأدعية …",
    empty: "لا نتائج",
    hint: "جميع الأدعية الـ140",
  },
};

let indexCache: SearchDoc[] | null = null;

async function loadIndex(): Promise<SearchDoc[]> {
  if (indexCache) return indexCache;
  const res = await fetch(dataUrl("search-index.json"), {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`search-index.json: HTTP ${res.status}`);
  indexCache = (await res.json()) as SearchDoc[];
  return indexCache;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(indexCache);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const t = TEXT[language] ?? TEXT.en;

  useEffect(() => {
    if (!isOpen || docs) return;
    let alive = true;
    loadIndex()
      .then((data) => alive && setDocs(data))
      .catch(
        (err) =>
          alive && setError(err instanceof Error ? err.message : String(err)),
      );
    return () => {
      alive = false;
    };
  }, [isOpen, docs]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActive(0);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!docs) return [];
    const needle = normalize(query);
    if (needle.length < 2) return [];
    return docs
      .filter((doc) =>
        [doc.ar, doc.de, doc.en, doc.fr, doc.ctx].some((field) =>
          normalize(field || "").includes(needle),
        ),
      )
      .slice(0, 50);
  }, [docs, query]);

  if (!isOpen) return null;

  const choose = (doc: SearchDoc) => {
    onSelect(doc.day, doc.id);
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.target !== inputRef.current || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[Math.min(active, results.length - 1)]);
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-panel search-panel"
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="dialog-header">
          <Icon name="search" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder={t.placeholder}
            aria-label={t.title}
          />
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={UI[language].close}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="search-results">
          {error && (
            <p className="empty-state" role="alert">
              {UI[language].loadError}
              <button
                onClick={() => {
                  setError(null);
                  setDocs(null);
                  void loadIndex()
                    .then(setDocs)
                    .catch(() => setError("load"));
                }}
              >
                {UI[language].retry}
              </button>
            </p>
          )}
          {!error && query.trim().length < 2 && (
            <p className="empty-state">{t.hint}</p>
          )}
          {!error && query.trim().length >= 2 && results.length === 0 && (
            <p className="empty-state" role="status">
              {t.empty}
            </p>
          )}
          <ul aria-label={t.title}>
            {results.map((doc, position) => (
              <li key={doc.id}>
                <button
                  className="search-result"
                  onClick={() => choose(doc)}
                  onMouseEnter={() => setActive(position)}
                  aria-current={position === active ? "true" : undefined}
                >
                  <span className="result-day">
                    {doc.dayName?.[language] ?? doc.day}
                  </span>
                  <p
                    lang="ar"
                    dir="rtl"
                    className="font-arabic text-lg line-clamp-2"
                  >
                    {doc.ar}
                  </p>
                  <p className="text-sm line-clamp-2">
                    {language === "de"
                      ? doc.de
                      : language === "fr"
                        ? doc.fr
                        : language === "ar"
                          ? doc.ctx
                          : doc.en}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
