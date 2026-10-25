import { describe, expect, it } from "vitest";
import { detectLanguage } from "../lib/language";

describe("detectLanguage", () => {
  it("nimmt die erste angebotene Gerätesprache", () => {
    expect(detectLanguage(["fr-CA", "en-US"])).toBe("fr");
    expect(detectLanguage(["en-GB"])).toBe("en");
    expect(detectLanguage(["de"])).toBe("de");
  });

  it("überspringt nicht angebotene Sprachen zugunsten weiterer Präferenzen", () => {
    expect(detectLanguage(["ar-SA", "en-US"])).toBe("en");
    expect(detectLanguage(["tr", "fr-FR"])).toBe("fr");
  });

  it("leitet die Sprache aus dem Land ab, wenn keine Sprache passt", () => {
    expect(detectLanguage(["ar-MA"])).toBe("fr");
    expect(detectLanguage(["tr-DE"])).toBe("de");
    expect(detectLanguage(["ur-PK"])).toBe("en");
    expect(detectLanguage(["zh-Hans-CH"])).toBe("de");
    expect(detectLanguage(["ar_DZ"])).toBe("fr");
  });

  it("nutzt die Zeitzone, wenn die Sprache kein Land enthält", () => {
    expect(detectLanguage(["ar"], "Africa/Casablanca")).toBe("fr");
    expect(detectLanguage(["tr"], "Europe/Berlin")).toBe("de");
    expect(detectLanguage(["bs"], "Europe/London")).toBe("en");
  });

  it("fällt sonst auf Deutsch zurück", () => {
    expect(detectLanguage([])).toBe("de");
    expect(detectLanguage([""], "")).toBe("de");
    expect(detectLanguage(["ar-SA"], "Asia/Riyadh")).toBe("de");
  });
});
