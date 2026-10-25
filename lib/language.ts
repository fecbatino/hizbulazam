import { Language } from "../types";

const SUPPORTED: readonly Language[] = ["de", "en", "fr"];

// Countries where readers most likely expect German or French when their
// device language itself is not offered (e.g. Arabic or Turkish in Morocco or
// Germany). Everything else falls through to the default below.
const REGION: Record<string, Language> = {
  DE: "de", AT: "de", CH: "de", LI: "de",
  FR: "fr", BE: "fr", LU: "fr", MC: "fr",
  MA: "fr", DZ: "fr", TN: "fr", MR: "fr",
  SN: "fr", CI: "fr", ML: "fr", BF: "fr", NE: "fr", TD: "fr", GN: "fr",
  BJ: "fr", TG: "fr", CM: "fr", GA: "fr", CG: "fr", CD: "fr", CF: "fr",
  DJ: "fr", KM: "fr", MG: "fr", HT: "fr",
  GB: "en", IE: "en", US: "en", CA: "en", AU: "en", NZ: "en",
  NG: "en", GH: "en", KE: "en", ZA: "en", PK: "en", IN: "en", MY: "en",
};

// Without a region in the locale, the time zone still names the country.
const TIME_ZONE: Record<string, string> = {
  "Europe/Berlin": "DE", "Europe/Vienna": "AT", "Europe/Zurich": "CH",
  "Europe/Paris": "FR", "Europe/Brussels": "BE", "Europe/Luxembourg": "LU",
  "Africa/Casablanca": "MA", "Africa/Algiers": "DZ", "Africa/Tunis": "TN",
  "Africa/Dakar": "SN", "Africa/Abidjan": "CI", "Africa/Bamako": "ML",
  "Africa/Douala": "CM", "Africa/Kinshasa": "CD",
  "Europe/London": "GB", "Europe/Dublin": "IE",
};

const primaryOf = (parts: string[]) =>
  (parts[0] ?? "").toLowerCase() as Language;
const regionOf = (parts: string[]) =>
  parts
    .slice(1)
    .find((part) => /^[a-z]{2}$/i.test(part))
    ?.toUpperCase();

/**
 * Picks the UI language for a reader without a saved choice:
 * 1. the device language itself, if the app offers it;
 * 2. otherwise the language of the device's country (region of that
 *    language tag, else the time zone). Browsers such as Chrome on Android
 *    append en-US to every language list, so later entries must not win
 *    over the country;
 * 3. otherwise the next preferred language the app offers, then the country
 *    of any later entry, then German.
 */
export function detectLanguage(
  languages: readonly string[],
  timeZone = "",
): Language {
  const tags = languages
    .filter(Boolean)
    .map((tag) => tag.replaceAll("_", "-").split("-"));
  const [device, ...rest] = tags;
  if (device) {
    if (SUPPORTED.includes(primaryOf(device))) return primaryOf(device);
    const country = regionOf(device) ?? TIME_ZONE[timeZone];
    if (country && REGION[country]) return REGION[country];
  } else if (REGION[TIME_ZONE[timeZone] ?? ""]) {
    return REGION[TIME_ZONE[timeZone]];
  }
  for (const parts of rest)
    if (SUPPORTED.includes(primaryOf(parts))) return primaryOf(parts);
  for (const parts of rest) {
    const region = regionOf(parts);
    if (region && REGION[region]) return REGION[region];
  }
  return "de";
}

/** Device languages and time zone as the browser reports them. */
export function deviceLanguage(): Language {
  let timeZone = "";
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    /* Older engines without Intl time zones fall back to the locale only. */
  }
  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || ""];
  return detectLanguage(languages, timeZone);
}

/** Explicit choice from the language menu. */
export const LANGUAGE_CHOICE_KEY = "hzaLanguageChoice";
// Releases up to 2026-10-25 wrote this key on every start, so a value there
// is not necessarily a choice.
const LEGACY_LANGUAGE_KEY = "hzaLanguage";

function storedLanguage(key: string): Language | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return SUPPORTED.includes(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * The reader's explicit choice, else the device language. The legacy key is
 * migrated once: "de" was the automatic default of older releases and is
 * dropped so the device decides; "en" and "fr" could only come from the menu
 * (or matched the device anyway) and are kept as a choice.
 */
export function initialLanguage(): Language {
  const choice = storedLanguage(LANGUAGE_CHOICE_KEY);
  if (choice) return choice;
  const legacy = storedLanguage(LEGACY_LANGUAGE_KEY);
  try {
    localStorage.removeItem(LEGACY_LANGUAGE_KEY);
    if (legacy && legacy !== "de") saveLanguageChoice(legacy);
  } catch {
    /* Without storage the device language applies on every start. */
  }
  return legacy && legacy !== "de" ? legacy : deviceLanguage();
}

export function saveLanguageChoice(language: Language) {
  try {
    localStorage.setItem(LANGUAGE_CHOICE_KEY, JSON.stringify(language));
  } catch {
    /* Language still works without persistence. */
  }
}
