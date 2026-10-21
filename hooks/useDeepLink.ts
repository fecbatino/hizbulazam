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

/** Liest den Hash beim Start und bei jeder Änderung (Zurück/Vor, geteilte Links). */
export function useDeepLink(): DeepLink {
  const [link, setLink] = useState<DeepLink>(() =>
    parseHash(window.location.hash),
  );

  useEffect(() => {
    const handler = () => setLink(parseHash(window.location.hash));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return link;
}

/** Tageswechsel schreibt den Hash, ohne die History zu fluten. */
export function setDayHash(day: string): void {
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
