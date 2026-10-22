import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const KEY = "hzaReadingPositions";
type Position = { id: string; offset: number };
export type Jump = { id: string; sequence: number } | null;
function readPositions(): Record<string, Position> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return Object.fromEntries(
      Object.entries(raw).filter((entry): entry is [string, Position] => {
        const value = entry[1] as Position | null;
        return (
          !!value &&
          typeof value.id === "string" &&
          Number.isFinite(value.offset)
        );
      }),
    );
  } catch {
    return {};
  }
}
export function useReadingPosition(
  day: string | undefined,
  ready: boolean,
  active: boolean,
  paused: boolean,
  jump: Jump,
) {
  const [positions] = useState(readPositions);
  const [currentDua, setCurrentDua] = useState(1);
  const restoring = useRef(false);
  const context = useRef({ day, ready, active, paused });
  const persist = useCallback(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(positions));
    } catch {
      /* Reading also works without storage. */
    }
  }, [positions]);
  const savePosition = useCallback(() => {
    const state = context.current;
    if (
      !state.day ||
      !state.ready ||
      !state.active ||
      state.paused ||
      restoring.current
    )
      return;
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-dua-id]"),
    );
    const top =
      (document.querySelector(".day-navigator")?.getBoundingClientRect()
        .bottom ?? 0) + 8;
    const index = cards.findIndex(
      (card) => card.getBoundingClientRect().bottom > top,
    );
    const card = cards[index];
    if (!card?.dataset.duaId) return;
    positions[state.day] = {
      id: card.dataset.duaId,
      offset: card.getBoundingClientRect().top,
    };
    setCurrentDua(index + 1);
    persist();
  }, [persist, positions]);

  useLayoutEffect(() => {
    context.current = { day, ready, active, paused };
  }, [day, ready, active, paused]);
  useLayoutEffect(() => {
    if (!day || !ready || !active || paused) return;
    restoring.current = true;
    let cancelled = false;
    let frame = 0;
    const restore = () => {
      if (cancelled) return;
      const saved = positions[day];
      const id = jump?.id ?? saved?.id;
      const target = id ? document.getElementById("dua-" + id) : null;
      const nav = document.querySelector(".day-navigator");
      const offset = jump
        ? (nav?.getBoundingClientRect().bottom ?? 0) + 16
        : (saved?.offset ?? 0);
      if (target)
        window.scrollBy({
          top: target.getBoundingClientRect().top - offset,
          behavior: "instant",
        });
      else window.scrollTo({ top: 0, behavior: "instant" });
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>("[data-dua-id]"),
      );
      setCurrentDua(
        Math.max(1, cards.findIndex((card) => card === target) + 1),
      );
      restoring.current = false;
    };
    // Fonts must settle before applying a stored offset. Never move the reader
    // later if they already started interacting while the font was loading.
    const interrupt = () => {
      cancelled = true;
      restoring.current = false;
    };
    window.addEventListener("touchstart", interrupt, {
      once: true,
      passive: true,
    });
    window.addEventListener("wheel", interrupt, { once: true, passive: true });
    const fonts = document.fonts?.ready ?? Promise.resolve();
    void fonts.then(() => {
      if (!cancelled) frame = requestAnimationFrame(restore);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      restoring.current = false;
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("wheel", interrupt);
    };
  }, [day, ready, active, paused, jump, positions]);
  useEffect(() => {
    let frame = 0;
    const scroll = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          savePosition();
        });
    };
    const original = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pagehide", persist);
      history.scrollRestoration = original;
      persist();
    };
  }, [savePosition, persist]);
  return { currentDua, savePosition };
}
