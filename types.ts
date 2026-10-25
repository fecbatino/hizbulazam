
/** UI language. Arabic is the source text, not a UI language. */
export type Language = 'en' | 'de' | 'fr';
/** Day names exist in every UI language plus Arabic. */
export type NameLanguage = Language | 'ar';

export type DayOfWeek = 'friday' | 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday';

/** Single source of truth for source types; settings and storage read it. */
export const SOURCE_TYPES = ['quran', 'sahih_hadith', 'hasan_hadith', 'weak_hadith', 'ikhtilaf', 'later_supplication', 'unknown'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];
export type GradingValue = 'sahih' | 'hasan' | 'daif' | 'ikhtilaf' | 'unknown';

export interface PrimarySource {
  book: string;
  ref: string;
}

export interface Grading {
  scholar: string;
  value: GradingValue;
  note: string;
}

export interface DuaItem {
  id: string;
  source_context_de: string;
  source_context_en: string;
  source_context_fr: string;
  arabic_text: string;
  translation_de: string;
  translation_en: string;
  translation_fr: string;
  source_type: SourceType;
  primary_sources: PrimarySource[];
  grading: Grading;
}

export interface DuaCollection {
  day: DayOfWeek;
  name: { [key in NameLanguage]: string };
  hizbTitle?: string;
  duas: DuaItem[];
}
