import React from 'react';
import { DuaCollection, Language, DuaItem } from '../types';
import { FavoriteIconSolid, FavoriteIconOutline, ShareIcon } from './icons';

interface DuaCardProps {
  collection: DuaCollection;
  language: Language;
  favorites: Set<string>;
  onToggleFavorite: (duaId: string) => void;
  showTranslation: boolean;
  showFavorites: boolean;
  showShare: boolean;
}

const FavoriteButton: React.FC<{ isFavorite: boolean; onClick: () => void }> = ({ isFavorite, onClick }) => {
  const label = isFavorite ? 'Remove from favorites' : 'Add to favorites';
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-full text-amber-400 hover:bg-amber-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors"
      aria-label={label}
    >
      {isFavorite ? <FavoriteIconSolid /> : <FavoriteIconOutline />}
    </button>
  );
};

const getSourceContext = (dua: DuaItem, lang: Language) => {
  switch (lang) {
    case 'de': return dua.source_context_de;
    case 'fr': return dua.source_context_fr;
    case 'en':
    default: return dua.source_context_en;
  }
};

const getTranslation = (dua: DuaItem, lang: Language) => {
  switch (lang) {
    case 'de': return dua.translation_de;
    case 'fr': return dua.translation_fr;
    case 'en':
    default: return dua.translation_en;
  }
};

// FIX: This component was incomplete, causing a type error. It is now fully implemented.
const ShareButton: React.FC<{ dua: DuaItem; language: Language }> = ({ dua, language }) => {
  const handleShare = async () => {
    const translation = getTranslation(dua, language);
    const sourceContext = getSourceContext(dua, language);
    const shareText = `"${dua.arabic_text}"\n\nTranslation (${language.toUpperCase()}): "${translation}"\n\nSource: ${sourceContext}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Dua: ${sourceContext}`,
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Dua copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy Dua.');
      });
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
      aria-label="Share Dua"
    >
      <ShareIcon />
    </button>
  );
};

// FIX: DuaCard was not exported, causing an import error in App.tsx. It is now implemented and exported.
export const DuaCard: React.FC<DuaCardProps> = ({
  collection,
  language,
  favorites,
  onToggleFavorite,
  showTranslation,
  showFavorites,
  showShare,
}) => {
  return (
    <div className="p-2 sm:p-4 space-y-4 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
      {collection.hizbTitle && (
        <h3 className="text-center font-semibold text-lg text-teal-600 dark:text-teal-400 pb-2 border-b-2 border-slate-200 dark:border-slate-700" lang="ar" dir="rtl">
          {collection.hizbTitle}
        </h3>
      )}
      {collection.duas.map((dua) => (
        <article key={dua.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 truncate">
                {getSourceContext(dua, language)}
              </p>
              <p lang="ar" dir="rtl" className="text-slate-800 dark:text-slate-100 font-amiri leading-loose" style={{ fontSize: 'var(--arabic-font-size)' }}>
                {dua.arabic_text}
              </p>
            </div>
            
            <div className="flex flex-col items-center ml-2 sm:ml-4 space-y-2 flex-shrink-0">
                {showFavorites && (
                  <FavoriteButton
                    isFavorite={favorites.has(dua.id)}
                    onClick={() => onToggleFavorite(dua.id)}
                  />
                )}
                {showShare && <ShareButton dua={dua} language={language} />}
            </div>
          </div>

          {showTranslation && (
            <div>
              <hr className="border-slate-200 dark:border-slate-700 my-4" />
              <p className="text-slate-600 dark:text-slate-300 italic text-base">
                {getTranslation(dua, language)}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center mt-2 text-xs">
            <p className="text-slate-400 dark:text-slate-500">
              {/* FIX: Property 'source_reference' does not exist on type 'DuaItem'. Use 'primary_sources' instead. */}
              {dua.primary_sources && dua.primary_sources.length > 0 && `Ref: ${dua.primary_sources.map(s => `${s.book} ${s.ref}`).join(', ')}`}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
};
