import { describe, expect, it } from 'vitest';
import { normalize } from '../lib/normalize';

describe('normalize (Suche)', () => {
  it('entfernt arabische Diakritika', () => {
    expect(normalize('بِسْمِ اللهِ')).toBe('بسم الله');
  });

  it('vereinheitlicht Alef-Formen und Ya', () => {
    expect(normalize('أَحْمَد')).toBe('احمد');
    expect(normalize('إبراهيم')).toBe('ابراهيم');
    expect(normalize('مُوسَى')).toBe('موسي');
  });

  it('lässt lateinische Suche unverändert bis auf Groß-/Kleinschreibung', () => {
    expect(normalize('Al-Fatiha')).toBe('al-fatiha');
    expect(normalize('  Freitag  ')).toBe('freitag');
  });

  it('behandelt leere Eingaben', () => {
    expect(normalize('')).toBe('');
    expect(normalize('   ')).toBe('');
  });
});
