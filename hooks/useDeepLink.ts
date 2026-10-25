import { useCallback, useEffect, useState } from "react";

export type DeepLink =
  | { kind: "day"; day: string }
  | { kind: "dua"; id: string }
  | null;

export function parseHash(hash: string): DeepLink {
  const raw = hash.replace(/^#\/?/, "").trim();
  if (!raw) return null;
  const parts = raw.split("/");
  const kind = parts[0];
  let value: string;
  try {
    value = decodeURIComponent(parts.slice(1).join("/"));
  } catch {
    return null;
  }
  if (!value) return null;
  if (kind === "day") return { kind: "day", day: value };
  if (kind === "dua") return { kind: "dua", id: value };
  return null;
}

// Zuletzt empfangener Link (jedes hashchange erzeugt ein neues Objekt). React
// kann einen Zwischenstand rendern, bevor dieses Update ankommt; solange der
// gerenderte Link nicht dieser ist, gilt der gerenderte Tag als überholt.
let latestLink: DeepLink = parseHash(window.location.hash);

/** Liest den Hash beim Start und bei jeder Änderung (Zurück/Vor, geteilte Links). */
export function useDeepLink(): DeepLink {
  const [link, setLink] = useState<DeepLink>(() => {
    latestLink = parseHash(window.location.hash);
    return latestLink;
  });

  useEffect(() => {
    const handler = () => {
      latestLink = parseHash(window.location.hash);
      setLink(latestLink);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return link;
}

/**
 * Tageswechsel schreibt den Hash, ohne die History zu fluten. `renderedLink`
 * ist der Link, auf dem der aufrufende Render beruht: Ist inzwischen ein
 * neuerer angekommen, darf der Tag des alten ihn nicht überschreiben.
 */
export function setDayHash(day: string, renderedLink: DeepLink): void {
  if (renderedLink !== latestLink) return;
  const next = `#/day/${encodeURIComponent(day)}`;
  if (window.location.hash !== next) {
    window.history.replaceState(null, "", next);
  }
}

/** Direktlink auf eine Dua - eigener History-Eintrag, damit Zurück funktioniert. */
export function setDuaHash(id: string): void {
  const next = `#/dua/${encodeURIComponent(id)}`;
  if (window.location.hash !== next) {
    window.history.pushState(null, "", next);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
}

export function useCopyLink(): () => Promise<void> {
  return useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
  }, []);
}

export function scrollToDua(id: string): void {
  const target = document.getElementById(`dua-${id}`);
  if (!target) return;
  target.scrollIntoView({ block: "start", behavior: "auto" });
  target.classList.add("dua-highlight");
  window.setTimeout(() => target.classList.remove("dua-highlight"), 2400);
}
