
export type Language = 'en' | 'de' | 'fr' | 'ar';

export type DayOfWeek = 'friday' | 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday';

export type SourceType = 'quran' | 'sahih_hadith' | 'hasan_hadith' | 'weak_hadith' | 'ikhtilaf' | 'later_supplication' | 'unknown';
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
  name: { [key in Language]: string };
  hizbTitle?: string;
  duas: DuaItem[];
}
