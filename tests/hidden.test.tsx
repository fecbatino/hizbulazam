import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { DuaCard } from "../components/DuaCard";
import {
  HiddenDuas,
  NOTHING_HIDDEN,
  hasHidden,
  hideDua,
  isHidden,
  pruneHidden,
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
const collection: DuaCollection = {
  day: "friday",
  name: { de: "Freitag", en: "Friday", fr: "Vendredi", ar: "الجمعة" },
  duas: [weak, quran],
};
const cardProps = {
  collection,
  language: "de" as const,
  favorites: new Set<string>(),
  onToggleFavorite: vi.fn(),
  showTranslation: true,
  showFavorites: false,
  showShare: false,
  translationFontSize: 1,
};

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
  });

  it("setzt einzelne Einblendungen zurück, wenn die Quelle umgeschaltet wird", () => {
    let hidden = setTypeHidden(NOTHING_HIDDEN, "weak_hadith", true);
    hidden = showDua(hidden, weak);
    hidden = setTypeHidden(hidden, "weak_hadith", false);
    expect(hidden.shown).toEqual({});
    expect(hasHidden(hidden)).toBe(false);
    hidden = setTypeHidden(hidden, "weak_hadith", true);
    expect(isHidden(hidden, weak)).toBe(true);
  });

  it("verwirft ungültige und veraltete gespeicherte Werte", () => {
    expect(sanitizeHidden(null)).toEqual(NOTHING_HIDDEN);
    expect(sanitizeHidden("x")).toEqual(NOTHING_HIDDEN);
    // The first release stored shown as an array.
    expect(
      sanitizeHidden({ ids: ["a", 1, "a"], types: ["quran", "bogus"], shown: ["b"] }),
    ).toEqual({ ids: ["a"], types: ["quran"], shown: {} });
    expect(
      sanitizeHidden({
        types: ["quran"],
        shown: { b: "quran", c: "weak_hadith", d: "bogus" },
      }),
    ).toEqual({ ids: [], types: ["quran"], shown: { b: "quran" } });
  });

  it("entfernt Ids, die es nicht mehr gibt, und bleibt sonst unverändert", () => {
    const hidden: HiddenDuas = {
      ids: ["a", "gone"],
      types: ["quran"],
      shown: { b: "quran", old: "quran" },
    };
    const days = [{ ids: ["a", "b"] }];
    expect(pruneHidden(hidden, days)).toEqual({
      ids: ["a"],
      types: ["quran"],
      shown: { b: "quran" },
    });
    const clean = pruneHidden(hidden, days);
    expect(pruneHidden(clean, days)).toBe(clean);
  });

  it("zeigt ausgeblendete Duas als schmale Zeile mit Anker und Einblenden", () => {
    const onHide = vi.fn();
    const onShow = vi.fn();
    render(
      <DuaCard
        {...cardProps}
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

  it("zeigt das Sprungziel trotz Ausblendung", () => {
    render(
      <DuaCard
        {...cardProps}
        hidden={setTypeHidden(NOTHING_HIDDEN, "weak_hadith", true)}
        reveal="a"
      />,
    );
    expect(screen.getByText("نص a")).toBeInTheDocument();
  });

  it("hält den Fokus beim Aus- und Einblenden an der Dua", () => {
    function Harness() {
      const [hidden, setHidden] = useState(NOTHING_HIDDEN);
      return (
        <DuaCard
          {...cardProps}
          hidden={hidden}
          onHide={(id) => setHidden((h) => hideDua(h, id))}
          onShow={(item) => setHidden((h) => showDua(h, item))}
        />
      );
    }
    render(<Harness />);
    const hideButton = screen.getAllByRole("button", { name: "Diese Dua ausblenden" })[1];
    hideButton.focus();
    fireEvent.click(hideButton);
    const showButton = screen.getByRole("button", { name: "Einblenden: Dua 2" });
    expect(showButton).toHaveFocus();
    fireEvent.click(showButton);
    expect(
      screen.getAllByRole("button", { name: "Diese Dua ausblenden" })[1],
    ).toHaveFocus();
  });
});
