import React from 'react';
import { DuaCollection, DuaItem, Language, SourceType } from '../types';

interface DuaCardProps {
  collection: DuaCollection;
  language: Language;
  favorites: Set<string>;
  onToggleFavorite: (duaId: string) => void;
  showTranslation: boolean;
  showFavorites: boolean;
  showShare: boolean;
  translationFontSize: number;
}

const BADGE: Record<Language, Record<SourceType, string>> = {
  en: { quran: 'Quran', sahih_hadith: 'Sahih Hadith', hasan_hadith: 'Hasan Hadith', weak_hadith: 'Weak Hadith', ikhtilaf: 'Ikhtilaf', later_supplication: 'Later Supplication', unknown: 'Unknown' },
  de: { quran: 'Quran', sahih_hadith: 'Sahih Hadith', hasan_hadith: 'Hasan Hadith', weak_hadith: 'Schwaches Hadith', ikhtilaf: 'Ikhtilaf', later_supplication: 'Späteres Gebet', unknown: 'Unbekannt' },
  fr: { quran: 'Coran', sahih_hadith: 'Hadith Sahih', hasan_hadith: 'Hadith Hasan', weak_hadith: 'Hadith Faible', ikhtilaf: 'Ikhtilaf', later_supplication: 'Supplication Tardive', unknown: 'Inconnu' },
  ar: { quran: 'قرآن', sahih_hadith: 'حديث صحيح', hasan_hadith: 'حديث حسن', weak_hadith: 'حديث ضعيف', ikhtilaf: 'اختلاف', later_supplication: 'دعاء متأخر', unknown: 'غير معروف' },
};

const PROGRESS_FN: Record<Language, (x: number, y: number) => string> = {
  en: (x, y) => `Dua ${x} of ${y}`,
  de: (x, y) => `Dua ${x} von ${y}`,
  fr: (x, y) => `Dua ${x} sur ${y}`,
  ar: (x, y) => `دعاء ${x} من ${y}`,
};

const getSourceContext = (dua: DuaItem, lang: Language): string => {
  if (lang === 'de') return dua.source_context_de;
  if (lang === 'fr') return dua.source_context_fr;
  return dua.source_context_en;
};

const getTranslation = (dua: DuaItem, lang: Language): string => {
  if (lang === 'de') return dua.translation_de;
  if (lang === 'fr') return dua.translation_fr;
  if (lang === 'ar') return '';
  return dua.translation_en;
};

const getSourceRef = (dua: DuaItem): string =>
  dua.primary_sources?.length
    ? dua.primary_sources.map(s => `${s.book} ${s.ref}`).join(', ')
    : '';

const shareIconStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: '50%',
  border: '1px solid var(--hza-border)', background: 'transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 14, color: 'var(--hza-hint)',
};

async function handleShare(dua: DuaItem, language: Language) {
  const translation = getTranslation(dua, language);
  const sourceContext = getSourceContext(dua, language);
  const text = `${dua.arabic_text}${translation ? `\n\n${translation}` : ''}\n\n${sourceContext}`;
  if (navigator.share) {
    try { await navigator.share({ text }); } catch {}
  } else {
    try { await navigator.clipboard.writeText(text); alert('Kopiert!'); } catch {}
  }
}

export const DuaCard = React.memo<DuaCardProps>(
  ({ collection, language, favorites, onToggleFavorite, showTranslation, showFavorites, showShare, translationFontSize }) => {
    const total = collection.duas.length;
    return (
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
        {collection.duas.map((dua, idx) => {
          const isFav = favorites.has(dua.id);
          const badge = BADGE[language]?.[dua.source_type] ?? dua.source_type;
          const sourceRef = getSourceRef(dua);
          const sourceCtx = getSourceContext(dua, language);
          const translation = getTranslation(dua, language);
          const footerText = sourceRef ? `${sourceRef} · ${sourceCtx}` : sourceCtx;

          return (
            <React.Fragment key={dua.id}>
              <article style={{
                background: 'var(--hza-card)',
                borderRadius: 16,
                border: '1px solid var(--hza-border)',
                overflow: 'hidden',
              }}>
                {/* Header: badge + actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px 10px',
                  borderBottom: '1px solid var(--hza-border)',
                }}>
                  <span style={{
                    background: 'var(--hza-green-light)', color: 'var(--hza-green-mid)',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500,
                    padding: '3px 9px', borderRadius: 20, letterSpacing: '0.02em',
                  }}>
                    {badge}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {showFavorites && (
                      <button
                        onClick={() => onToggleFavorite(dua.id)}
                        aria-label={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                        style={{ ...shareIconStyle, color: isFav ? 'var(--hza-gold)' : 'var(--hza-hint)' }}
                      >
                        {isFav ? '★' : '☆'}
                      </button>
                    )}
                    {showShare && (
                      <button onClick={() => handleShare(dua, language)} aria-label="Teilen" style={shareIconStyle}>
                        ↗
                      </button>
                    )}
                  </div>
                </div>

                {/* Arabic text */}
                <p
                  lang="ar"
                  dir="rtl"
                  style={{
                    fontFamily: "'Amiri', serif",
                    fontSize: 'var(--arabic-font-size, 1.9rem)',
                    lineHeight: 2.2,
                    textAlign: 'center',
                    color: 'var(--hza-text)',
                    padding: '18px 16px',
                    margin: 0,
                  }}
                >
                  {dua.arabic_text}
                </p>

                {/* Translation */}
                {showTranslation && language !== 'ar' && translation && (
                  <>
                    <div style={{ height: 1, background: 'var(--hza-border)', margin: '0 14px' }} />
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: `${translationFontSize}rem`,
                      fontStyle: 'italic',
                      color: 'var(--hza-muted)',
                      padding: '12px 14px',
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {translation}
                    </p>
                  </>
                )}

                {/* Footer */}
                {footerText && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px 12px' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--hza-green)', flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--hza-hint)', lineHeight: 1.4 }}>
                      {footerText}
                    </span>
                  </div>
                )}
              </article>

              {/* Progress indicator */}
              <p style={{
                textAlign: 'center',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: 'var(--hza-hint)',
                margin: '2px 0',
              }}>
                {PROGRESS_FN[language]?.(idx + 1, total)}
              </p>
            </React.Fragment>
          );
        })}
      </div>
    );
  },
  (prev, next) => {
    if (prev.collection !== next.collection) return false;
    if (prev.language !== next.language) return false;
    if (prev.showTranslation !== next.showTranslation) return false;
    if (prev.showFavorites !== next.showFavorites) return false;
    if (prev.showShare !== next.showShare) return false;
    if (prev.translationFontSize !== next.translationFontSize) return false;
    if (prev.onToggleFavorite !== next.onToggleFavorite) return false;
    if (prev.favorites.size !== next.favorites.size) return false;
    for (const f of prev.favorites) if (!next.favorites.has(f)) return false;
    return true;
  }
);
