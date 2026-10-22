import { useEffect, useLayoutEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Dialog scrolling and focus belong to the opening session, not its renders. */
export function useFocusTrap<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void,
) {
  const ref = useRef<T | null>(null);
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (!isOpen || !ref.current) return;
    const node = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const y = window.scrollY;
    const x = window.scrollX;
    const body = document.body;
    const original = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = `-${x}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    const background = Array.from(
      document.querySelectorAll<HTMLElement>("[data-dialog-background]"),
    );
    const inert = background.map((el) => el.inert);
    background.forEach((el) => {
      el.inert = true;
    });
    const visible = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hidden && el.getClientRects().length > 0,
      );
    const raf = window.requestAnimationFrame(() =>
      (visible()[0] ?? node).focus({ preventScroll: true }),
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      }
      if (event.key !== "Tab") return;
      const items = visible();
      const first = items[0],
        last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        node.focus({ preventScroll: true });
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === node)
      ) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === node)
      ) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      node.removeEventListener("keydown", onKeyDown);
      background.forEach((el, index) => {
        el.inert = inert[index];
      });
      Object.assign(body.style, original);
      window.scrollTo({ left: x, top: y, behavior: "instant" });
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [isOpen]);
  return ref;
}
