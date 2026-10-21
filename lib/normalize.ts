const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

/**
 * Vereinheitlicht Suchbegriff und Text: Kleinschreibung, arabische Diakritika
 * entfernen, Alef-Formen und Ya angleichen, Tatweel entfernen.
 */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(AR_DIACRITICS, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0640/g, '')
    .trim();
}
