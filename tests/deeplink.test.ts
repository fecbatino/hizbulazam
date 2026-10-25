import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  parseHash,
  setDayHash,
  setDuaHash,
  useDeepLink,
} from "../hooks/useDeepLink";

describe("parseHash", () => {
  it("erkennt Tages- und Dua-Links", () => {
    expect(parseHash("#/day/friday")).toEqual({ kind: "day", day: "friday" });
    expect(parseHash("#/dua/fatiha")).toEqual({ kind: "dua", id: "fatiha" });
  });

  it("akzeptiert Varianten ohne Schrägstrich", () => {
    expect(parseHash("#day/sunday")).toEqual({ kind: "day", day: "sunday" });
    expect(parseHash("#/dua/dua%2Dmit%2Dstrich")).toEqual({
      kind: "dua",
      id: "dua-mit-strich",
    });
  });

  it("ignoriert Unbekanntes und Leeres", () => {
    expect(parseHash("")).toBeNull();
    expect(parseHash("#")).toBeNull();
    expect(parseHash("#/unbekannt/x")).toBeNull();
    expect(parseHash("#/day/")).toBeNull();
    expect(parseHash("#/dua/%E0%A4%A")).toBeNull();
  });
});

describe("Hash schreiben", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("setzt Tageslinks ohne History-Eintrag", () => {
    const before = window.history.length;
    setDayHash("monday", null);
    expect(window.location.hash).toBe("#/day/monday");
    expect(window.history.length).toBe(before);
  });

  it("setzt Dua-Links als eigenen Eintrag und meldet die Änderung", () => {
    const events: string[] = [];
    const listener = () => events.push(window.location.hash);
    window.addEventListener("hashchange", listener);
    setDuaHash("fatiha");
    window.removeEventListener("hashchange", listener);
    expect(window.location.hash).toBe("#/dua/fatiha");
    expect(events).toContain("#/dua/fatiha");
  });

  it("schreibt nicht doppelt", () => {
    setDayHash("tuesday", null);
    const first = window.location.href;
    setDayHash("tuesday", null);
    expect(window.location.href).toBe(first);
  });
});

describe("schnelle Hash-Wechsel", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("überschreibt keinen neueren, noch nicht gerenderten Link", async () => {
    const { result } = renderHook(() => useDeepLink());
    const rendered = result.current;
    // The reader opens a dua link; its hashchange arrives, but the caller
    // still renders the previous link.
    act(() => {
      window.location.hash = "#/dua/fatiha";
    });
    await waitFor(() =>
      expect(result.current).toEqual({ kind: "dua", id: "fatiha" }),
    );
    setDayHash("monday", rendered);
    expect(window.location.hash).toBe("#/dua/fatiha");
    // With the current link the day hash is written as before.
    setDayHash("monday", result.current);
    expect(window.location.hash).toBe("#/day/monday");
  });
});
