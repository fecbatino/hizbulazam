import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DuaCard } from '../components/DuaCard';
import type { DuaCollection } from '../types';

const collection: DuaCollection = {
  day: 'friday',
  name: { en: 'Friday', de: 'Freitag', fr: 'Vendredi', ar: 'الجمعة' },
  hizbTitle: 'Test',
  duas: [
    {
      id: 'test-dua',
      source_context_de: 'Testkontext',
      source_context_en: 'Test context',
      source_context_fr: 'Contexte',
      arabic_text: 'بِسْمِ اللهِ',
      translation_de: 'Im Namen Allahs',
      translation_en: 'In the name of Allah',
      translation_fr: 'Au nom d Allah',
      source_type: 'later_supplication',
      primary_sources: [],
      grading: { scholar: 'consensus', value: 'sahih', note: 'Test' },
    },
  ],
};

describe('DuaCard', () => {
  it('rendert arabischen Text rechtsläufig mit Sprunganker', () => {
    render(
      <DuaCard
        collection={collection}
        language="de"
        favorites={new Set()}
        onToggleFavorite={vi.fn()}
        showTranslation
        showFavorites
        showShare={false}
        translationFontSize={1}
      />
    );

    const arabic = screen.getByText('بِسْمِ اللهِ');
    expect(arabic).toHaveAttribute('dir', 'rtl');
    expect(arabic).toHaveAttribute('lang', 'ar');
    expect(document.getElementById('dua-test-dua')).toBeInTheDocument();
    expect(screen.getByText('Im Namen Allahs')).toBeInTheDocument();
  });

  it('blendet die Übersetzung aus, wenn sie abgeschaltet ist', () => {
    render(
      <DuaCard
        collection={collection}
        language="de"
        favorites={new Set()}
        onToggleFavorite={vi.fn()}
        showTranslation={false}
        showFavorites={false}
        showShare={false}
        translationFontSize={1}
      />
    );
    expect(screen.queryByText('Im Namen Allahs')).not.toBeInTheDocument();
  });
});
