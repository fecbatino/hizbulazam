import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'public', 'data');
const index = JSON.parse(readFileSync(join(DATA_DIR, 'collections.json'), 'utf8')) as {
  collections: Array<{ day: string; order: number; name: Record<string, string>; ids: string[]; count: number }>;
};
const days = index.collections.map(entry => ({
  meta: entry,
  data: JSON.parse(readFileSync(join(DATA_DIR, `day-${entry.day}.json`), 'utf8')) as {
    day: string;
    duas: Array<Record<string, unknown>>;
  },
}));
const search = JSON.parse(readFileSync(join(DATA_DIR, 'search-index.json'), 'utf8')) as Array<{ id: string; day: string; ar: string }>;
const REQUIRED = [
  'id', 'arabic_text', 'translation_de', 'translation_en', 'translation_fr',
  'source_context_de', 'source_context_en', 'source_context_fr', 'source_type', 'grading',
];

describe('Dua-Daten', () => {
  it('enthält sieben Tage in Wochenreihenfolge', () => {
    expect(index.collections).toHaveLength(7);
    expect(index.collections.map(c => c.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(index.collections[0].day).toBe('friday');
  });

  it('hat 140 Duas, passend zu Index und Suchindex', () => {
    const total = days.reduce((sum, entry) => sum + entry.data.duas.length, 0);
    expect(total).toBe(140);
    expect(search).toHaveLength(total);
    expect(days.reduce((sum, entry) => sum + entry.meta.ids.length, 0)).toBe(total);
  });

  it('hat global eindeutige IDs', () => {
    const ids = days.flatMap(entry => entry.data.duas.map(dua => String(dua.id)));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('füllt alle Pflichtfelder jeder Dua', () => {
    const broken: string[] = [];
    for (const entry of days) {
      for (const dua of entry.data.duas) {
        for (const field of REQUIRED) {
          const value = dua[field];
          if (value === undefined || value === null || value === '') broken.push(`${dua.id}.${field}`);
        }
        if (!/^[\u0600-\u06FF\s]/.test(String(dua.arabic_text))) broken.push(`${dua.id}.arabic_text (kein arabischer Text)`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('enthält im gesamten arabischen Text keine fremden Buchstaben oder beschädigten Zeichen', () => {
    const broken: string[] = [];
    for (const entry of days) {
      for (const dua of entry.data.duas) {
        for (const character of String(dua.arabic_text)) {
          const foreignLetter = /\p{L}/u.test(character) && !/\p{Script_Extensions=Arabic}/u.test(character);
          if (foreignLetter || /[\p{C}\uFFFD]/u.test(character)) {
            const code = character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
            broken.push(`${entry.meta.day}/${dua.id}: U+${code}`);
          }
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('hält IDs und arabische Volltexte im Suchindex identisch zu den Tagesdateien', () => {
    const byDay = new Map(days.map(entry => [
      entry.meta.day,
      new Map(entry.data.duas.map(dua => [String(dua.id), String(dua.arabic_text)])),
    ]));
    for (const doc of search) {
      const arabic = byDay.get(doc.day)?.get(doc.id);
      expect(arabic, `${doc.day}/${doc.id}`).toBeDefined();
      expect(doc.ar, `${doc.day}/${doc.id}`).toBe(arabic);
    }
  });

  it('legt keine unnötigen Dateien im Datenverzeichnis ab', () => {
    const files = readdirSync(DATA_DIR).filter(name => !name.startsWith('.'));
    expect(files.sort()).toEqual(
      ['collections.json', 'search-index.json', ...days.map(entry => `day-${entry.meta.day}.json`)].sort()
    );
  });
});
