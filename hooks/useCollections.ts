import { useCallback, useEffect, useState } from "react";
import { dataUrl } from "../lib/dataUrl";
import { DayOfWeek, DuaCollection, Language } from "../types";

export interface CollectionMeta {
  day: DayOfWeek;
  order: number;
  name: Record<Language, string>;
  hizbTitle?: string;
  count: number;
  ids: string[];
}

const dayCache = new Map<string, DuaCollection>();
const inflight = new Map<string, Promise<DuaCollection>>();

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(dataUrl(file), { credentials: "same-origin" });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Lädt die Sammlung eines Tages. Ergebnisse werden im Modul-Cache gehalten. */
export function loadDay(day: string): Promise<DuaCollection> {
  const cached = dayCache.get(day);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(day);
  if (pending) return pending;

  const request = getJson<DuaCollection>(`day-${day}.json`)
    .then((collection) => {
      dayCache.set(day, collection);
      inflight.delete(day);
      return collection;
    })
    .catch((error) => {
      inflight.delete(day);
      throw error;
    });

  inflight.set(day, request);
  return request;
}

/** Index aller Tage (Namen, Reihenfolge, Dua-IDs) - klein, wird sofort geladen. */
export function useCollectionsMeta() {
  const [meta, setMeta] = useState<CollectionMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setError(null);
    getJson<{ collections: CollectionMeta[] }>("collections.json")
      .then((data) => {
        if (!alive) return;
        setMeta([...data.collections].sort((a, b) => a.order - b.order));
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  return { meta, error, retry };
}

export function loadAllDays(meta: CollectionMeta[]): Promise<DuaCollection[]> {
  return Promise.all(meta.map((entry) => loadDay(entry.day)));
}

export function findDayByDuaId(
  meta: CollectionMeta[],
  duaId: string,
): CollectionMeta | undefined {
  return meta.find((entry) => entry.ids.includes(duaId));
}
