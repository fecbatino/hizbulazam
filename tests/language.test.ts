import { afterEach, describe, expect, it } from "vitest";
import {
  LANGUAGE_CHOICE_KEY,
  detectLanguage,
  initialLanguage,
  saveLanguageChoice,
} from "../lib/language";

describe("detectLanguage", () => {
  it("nimmt die Gerätesprache, wenn die App sie anbietet", () => {
    expect(detectLanguage(["fr-CA", "en-US"])).toBe("fr");
    expect(detectLanguage(["en-GB"])).toBe("en");
    expect(detectLanguage(["de"])).toBe("de");
  });

  it("lässt das Land der Gerätesprache vor angehängten Sprachen gelten", () => {
    // Chrome on Android appends en-US/en to the device language.
    expect(detectLanguage(["ar-MA", "ar", "en-US", "en"])).toBe("fr");
    expect(detectLanguage(["tr-DE", "tr", "en-US"])).toBe("de");
    expect(detectLanguage(["ar", "en-US"], "Africa/Casablanca")).toBe("fr");
  });

  it("nimmt weitere Präferenzen, wenn das Land nichts ergibt", () => {
    expect(detectLanguage(["ar-SA", "en-US"])).toBe("en");
    expect(detectLanguage(["ar-SA", "fr-FR"])).toBe("fr");
    expect(detectLanguage(["tr", "fr-FR"])).toBe("fr");
  });

  it("leitet die Sprache aus dem Land ab, wenn keine Sprache passt", () => {
    expect(detectLanguage(["ar-MA"])).toBe("fr");
    expect(detectLanguage(["tr-DE"])).toBe("de");
    expect(detectLanguage(["ur-PK"])).toBe("en");
    expect(detectLanguage(["zh-Hans-CH"])).toBe("de");
    expect(detectLanguage(["ar_DZ"])).toBe("fr");
    expect(detectLanguage(["ar-SA", "tr-DE"])).toBe("de");
  });

  it("nutzt die Zeitzone, wenn die Sprache kein Land enthält", () => {
    expect(detectLanguage(["ar"], "Africa/Casablanca")).toBe("fr");
    expect(detectLanguage(["tr"], "Europe/Berlin")).toBe("de");
    expect(detectLanguage(["bs"], "Europe/London")).toBe("en");
    expect(detectLanguage([], "Europe/Paris")).toBe("fr");
  });

  it("fällt sonst auf Deutsch zurück", () => {
    expect(detectLanguage([])).toBe("de");
    expect(detectLanguage([""], "")).toBe("de");
    expect(detectLanguage(["ar-SA"], "Asia/Riyadh")).toBe("de");
  });
});

describe("initialLanguage", () => {
  afterEach(() => localStorage.clear());
  // jsdom reports navigator.languages = ["en-US"].

  it("nimmt die ausdrückliche Wahl", () => {
    saveLanguageChoice("fr");
    expect(initialLanguage()).toBe("fr");
  });

  it("übernimmt alte en/fr-Werte einmalig als Wahl", () => {
    localStorage.setItem("hzaLanguage", JSON.stringify("fr"));
    expect(initialLanguage()).toBe("fr");
    expect(localStorage.getItem("hzaLanguage")).toBeNull();
    expect(localStorage.getItem(LANGUAGE_CHOICE_KEY)).toBe('"fr"');
  });

  it("verwirft das alte automatische \"de\" zugunsten des Geräts", () => {
    localStorage.setItem("hzaLanguage", JSON.stringify("de"));
    expect(initialLanguage()).toBe("en");
    expect(localStorage.getItem("hzaLanguage")).toBeNull();
    expect(localStorage.getItem(LANGUAGE_CHOICE_KEY)).toBeNull();
  });

  it("ignoriert ungültige Werte wie das frühere \"ar\"", () => {
    localStorage.setItem(LANGUAGE_CHOICE_KEY, JSON.stringify("ar"));
    localStorage.setItem("hzaLanguage", "kaputt");
    expect(initialLanguage()).toBe("en");
  });
});
