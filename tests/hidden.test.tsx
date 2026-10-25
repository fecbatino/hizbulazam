import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DuaCard } from "../components/DuaCard";
import {
  NOTHING_HIDDEN,
  hideDua,
  isHidden,
  sanitizeHidden,
  setTypeHidden,
  showDua,
} from "../lib/hidden";
import type { DuaCollection, DuaItem, SourceType } from "../types";

function dua(id: string, source_type: SourceType): DuaItem {
  return {
    id,
    source_context_de: "Kontext " + id,
    source_context_en: "Context " + id,
    source_context_fr: "Contexte " + id,
    arabic_text: "نص " + id,
    translation_de: "Übersetzung " + id,
    translation_en: "Translation " + id,
    translation_fr: "Traduction " + id,
    source_type,
    primary_sources: [],
    grading: { scholar: "test", value: "unknown", note: "" },
  };
}
const weak = dua("a", "weak_hadith");
const quran = dua("b", "quran");

describe("hidden duas", () => {
  it("blendet einzeln und nach Quelle aus und wieder ein", () => {
    let hidden = hideDua(NOTHING_HIDDEN, "b");
    expect(isHidden(hidden, quran)).toBe(true);
    expect(isHidden(hidden, weak)).toBe(false);
    hidden = setTypeHidden(hidden, "weak_hadith", true);
    expect(isHidden(hidden, weak)).toBe(true);
    // Showing one dua of a hidden type keeps the type hidden for the rest.
    hidden = showDua(hidden, weak);
    expect(isHidden(hidden, weak)).toBe(false);
    expect(isHidden(hidden, dua("c", "weak_hadith"))).toBe(true);
    hidden = showDua(hidden, quran);
    expect(isHidden(hidden, quran)).toBe(false);
    // Hiding again overrides an earlier "show".
    expect(isHidden(hideDua(hidden, "a"), weak)).toBe(true);
    hidden = setTypeHidden(hidden, "weak_hadith", false);
    expect(hidden.types).toEqual([]);
  });

  it("verwirft ungültige gespeicherte Werte", () => {
    expect(sanitizeHidden(null)).toEqual(NOTHING_HIDDEN);
    expect(sanitizeHidden("x")).toEqual(NOTHING_HIDDEN);
    expect(
      sanitizeHidden({ ids: ["a", 1, "a"], types: ["quran", "bogus"], shown: {} }),
    ).toEqual({ ids: ["a"], types: ["quran"], shown: [] });
  });

  it("zeigt ausgeblendete Duas als schmale Zeile mit Anker und Einblenden", () => {
    const collection: DuaCollection = {
      day: "friday",
      name: { de: "Freitag", en: "Friday", fr: "Vendredi", ar: "الجمعة" },
      duas: [weak, quran],
    };
    const onHide = vi.fn();
    const onShow = vi.fn();
    render(
      <DuaCard
        collection={collection}
        language="de"
        favorites={new Set()}
        onToggleFavorite={vi.fn()}
        showTranslation
        showFavorites={false}
        showShare={false}
        translationFontSize={1}
        hidden={setTypeHidden(NOTHING_HIDDEN, "weak_hadith", true)}
        onHide={onHide}
        onShow={onShow}
      />,
    );
    expect(screen.queryByText("نص a")).not.toBeInTheDocument();
    expect(document.getElementById("dua-a")).toHaveAttribute("data-dua-id", "a");
    expect(screen.getByText("Ausgeblendet")).toBeInTheDocument();
    expect(screen.getByText("Dua 1 von 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Einblenden: Dua 1" }));
    expect(onShow).toHaveBeenCalledWith(weak);
    expect(screen.getByText("نص b")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Diese Dua ausblenden" }));
    expect(onHide).toHaveBeenCalledWith("b");
  });
});
