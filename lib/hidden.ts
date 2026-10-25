import { DuaItem, SOURCE_TYPES, SourceType } from "../types";

export const HIDDEN_STORAGE_KEY = "hzaHiddenDuas";

/**
 * What the reader chose not to see in the daily reading. Duas are hidden one
 * by one (ids) or by source type (types); shown lists single duas brought
 * back from a hidden type, with that type, so switching the type off or on
 * again starts from a clean slate. Nothing is removed from the data.
 */
export interface HiddenDuas {
  ids: string[];
  types: SourceType[];
  shown: Record<string, SourceType>;
}
export const NOTHING_HIDDEN: HiddenDuas = { ids: [], types: [], shown: {} };

const isSourceType = (value: unknown): value is SourceType =>
  (SOURCE_TYPES as readonly unknown[]).includes(value);
const strings = (value: unknown) =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string"))]
    : [];

/** Accepts whatever storage returned and keeps only well-formed entries. */
export function sanitizeHidden(value: unknown): HiddenDuas {
  if (!value || typeof value !== "object") return NOTHING_HIDDEN;
  const raw = value as Record<string, unknown>;
  const types = strings(raw.types).filter(isSourceType);
  // Overrides only matter for a type that is hidden; anything else (including
  // the array form of the first release) is dropped.
  const shown =
    raw.shown && typeof raw.shown === "object" && !Array.isArray(raw.shown)
      ? Object.fromEntries(
          Object.entries(raw.shown).filter(
            (entry): entry is [string, SourceType] =>
              isSourceType(entry[1]) && types.includes(entry[1]),
          ),
        )
      : {};
  return { ids: strings(raw.ids), types, shown };
}

export const hasHidden = (hidden: HiddenDuas) =>
  hidden.ids.length > 0 || hidden.types.length > 0;

export function isHidden(hidden: HiddenDuas, dua: DuaItem) {
  if (dua.id in hidden.shown) return false;
  return hidden.ids.includes(dua.id) || hidden.types.includes(dua.source_type);
}

export function hideDua(hidden: HiddenDuas, id: string): HiddenDuas {
  const shown = { ...hidden.shown };
  delete shown[id];
  return {
    ...hidden,
    ids: hidden.ids.includes(id) ? hidden.ids : [...hidden.ids, id],
    shown,
  };
}

export function showDua(hidden: HiddenDuas, dua: DuaItem): HiddenDuas {
  const byType = hidden.types.includes(dua.source_type);
  return {
    ...hidden,
    ids: hidden.ids.filter((item) => item !== dua.id),
    shown: byType ? { ...hidden.shown, [dua.id]: dua.source_type } : hidden.shown,
  };
}

export function setTypeHidden(
  hidden: HiddenDuas,
  type: SourceType,
  hide: boolean,
): HiddenDuas {
  const types = hidden.types.filter((item) => item !== type);
  return {
    ...hidden,
    types: hide ? [...types, type] : types,
    // Toggling a type resets the single duas brought back from it.
    shown: Object.fromEntries(
      Object.entries(hidden.shown).filter(([, item]) => item !== type),
    ),
  };
}

/**
 * Removes ids that no longer exist in the collection. Returns the same object
 * when nothing changed, so it can run on every load without a re-render.
 */
export function pruneHidden(
  hidden: HiddenDuas,
  days: readonly { ids: readonly string[] }[],
): HiddenDuas {
  const known = new Set(days.flatMap((day) => day.ids));
  const ids = hidden.ids.filter((id) => known.has(id));
  const shownIds = Object.keys(hidden.shown);
  const shown = shownIds.filter((id) => known.has(id));
  if (ids.length === hidden.ids.length && shown.length === shownIds.length)
    return hidden;
  return {
    ...hidden,
    ids,
    shown: Object.fromEntries(shown.map((id) => [id, hidden.shown[id]])),
  };
}
