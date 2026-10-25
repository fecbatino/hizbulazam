import { DuaItem, SourceType } from "../types";

export const HIDDEN_STORAGE_KEY = "hzaHiddenDuas";
export const SOURCE_TYPES: readonly SourceType[] = [
  "quran",
  "sahih_hadith",
  "hasan_hadith",
  "weak_hadith",
  "ikhtilaf",
  "later_supplication",
  "unknown",
];

/**
 * What the reader chose not to see in the daily reading. Duas are hidden one
 * by one (ids) or by source type (types); shown overrides a type for single
 * duas the reader brought back. Nothing is removed from the data.
 */
export interface HiddenDuas {
  ids: string[];
  types: SourceType[];
  shown: string[];
}
export const NOTHING_HIDDEN: HiddenDuas = { ids: [], types: [], shown: [] };

const strings = (value: unknown) =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string"))]
    : [];

/** Accepts whatever storage returned and keeps only well-formed entries. */
export function sanitizeHidden(value: unknown): HiddenDuas {
  if (!value || typeof value !== "object") return NOTHING_HIDDEN;
  const raw = value as Record<string, unknown>;
  return {
    ids: strings(raw.ids),
    types: strings(raw.types).filter((type): type is SourceType =>
      SOURCE_TYPES.includes(type as SourceType),
    ),
    shown: strings(raw.shown),
  };
}

export function isHidden(hidden: HiddenDuas, dua: DuaItem) {
  if (hidden.shown.includes(dua.id)) return false;
  return hidden.ids.includes(dua.id) || hidden.types.includes(dua.source_type);
}

export function hideDua(hidden: HiddenDuas, id: string): HiddenDuas {
  return {
    ...hidden,
    ids: hidden.ids.includes(id) ? hidden.ids : [...hidden.ids, id],
    shown: hidden.shown.filter((item) => item !== id),
  };
}

export function showDua(hidden: HiddenDuas, dua: DuaItem): HiddenDuas {
  const byType = hidden.types.includes(dua.source_type);
  return {
    ...hidden,
    ids: hidden.ids.filter((item) => item !== dua.id),
    shown:
      byType && !hidden.shown.includes(dua.id)
        ? [...hidden.shown, dua.id]
        : hidden.shown,
  };
}

export function setTypeHidden(
  hidden: HiddenDuas,
  type: SourceType,
  hide: boolean,
): HiddenDuas {
  const types = hidden.types.filter((item) => item !== type);
  return { ...hidden, types: hide ? [...types, type] : types };
}
