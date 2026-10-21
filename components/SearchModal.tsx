import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Language } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { normalize } from '../lib/normalize';

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
  de: { title: 'Suche', placeholder: 'Dua suchen — arabisch, deutsch, französisch …', empty: 'Keine Treffer', hint: 'Alle 140 Duas der Woche' },
  en: { title: 'Search', placeholder: 'Search dua — Arabic, English, French …', empty: 'No matches', hint: 'All 140 duas of the week' },
  fr: { title: 'Recherche', placeholder: 'Chercher une dua — arabe, français, allemand …', empty: 'Aucun résultat', hint: 'Les 140 duas de la semaine' },
  ar: { title: 'بحث', placeholder: 'ابحث في الأدعية …', empty: 'لا نتائج', hint: 'جميع الأدعية الـ140' },
};

let indexCache: SearchDoc[] | null = null;

async function loadIndex(): Promise<SearchDoc[]> {
  if (indexCache) return indexCache;
  const base = import.meta.env.BASE_URL || '/';
  const res = await fetch(`${base}data/search-index.json`, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`search-index.json: HTTP ${res.status}`);
  indexCache = (await res.json()) as SearchDoc[];
  return indexCache;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, language, onSelect }) => {
  const [query, setQuery] = useState('');
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
      .then(data => alive && setDocs(data))
      .catch(err => alive && setError(err instanceof Error ? err.message : String(err)));
    return () => {
      alive = false;
    };
  }, [isOpen, docs]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!docs) return [];
    const needle = normalize(query);
    if (needle.length < 2) return [];
    return docs
      .filter(doc =>
        [doc.ar, doc.de, doc.en, doc.fr, doc.ctx].some(field => normalize(field || '').includes(needle))
      )
      .slice(0, 50);
  }, [docs, query]);

  if (!isOpen) return null;

  const choose = (doc: SearchDoc) => {
    onSelect(doc.day, doc.id);
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(i => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(i => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(results[Math.min(active, results.length - 1)]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-800 shadow-xl"
        onClick={event => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <span aria-hidden="true" className="text-slate-400">⌕</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder={t.placeholder}
            aria-label={t.title}
            className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {error && (
            <p role="alert" className="px-4 py-3 text-sm text-red-600">{error}</p>
          )}
          {!error && query.trim().length < 2 && (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">{t.hint}</p>
          )}
          {!error && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">{t.empty}</p>
          )}
          <ul role="listbox" aria-label={t.title} className="divide-y divide-slate-100 dark:divide-slate-700">
            {results.map((doc, position) => (
              <li key={doc.id} role="option" aria-selected={position === active}>
                <button
                  onClick={() => choose(doc)}
                  onMouseEnter={() => setActive(position)}
                  className={`w-full text-left px-4 py-3 ${position === active ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-slate-400">{doc.dayName?.[language] ?? doc.day}</span>
                    <span className="text-xs text-slate-400">{doc.id}</span>
                  </div>
                  <p lang="ar" dir="rtl" className="mt-1 font-arabic text-lg text-slate-800 dark:text-slate-100 line-clamp-2">
                    {doc.ar}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {language === 'de' ? doc.de : language === 'fr' ? doc.fr : language === 'ar' ? doc.ctx : doc.en}
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
