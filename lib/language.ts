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

/**
 * Picks the UI language for a reader without a saved choice: the first
 * preferred device language the app offers, otherwise the language of the
 * device's country (locale region, then time zone), otherwise German.
 */
export function detectLanguage(
  languages: readonly string[],
  timeZone = "",
): Language {
  const tags = languages.map((tag) => tag.replace("_", "-").split("-"));
  for (const [primary] of tags) {
    const language = primary?.toLowerCase() as Language;
    if (SUPPORTED.includes(language)) return language;
  }
  for (const parts of tags) {
    const region = parts
      .slice(1)
      .find((part) => /^[a-z]{2}$/i.test(part))
      ?.toUpperCase();
    if (region && REGION[region]) return REGION[region];
  }
  return REGION[TIME_ZONE[timeZone] ?? ""] ?? "de";
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
