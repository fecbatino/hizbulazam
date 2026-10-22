import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useReadingPosition } from "../hooks/useReadingPosition";
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  localStorage.clear();
  vi.restoreAllMocks();
});
it("restores the saved dua and offset, rather than resetting to the start", async () => {
  localStorage.setItem(
    "hzaReadingPositions",
    JSON.stringify({ friday: { id: "second", offset: 140 } }),
  );
  document.body.innerHTML =
    '<article id="dua-first" data-dua-id="first"></article><article id="dua-second" data-dua-id="second"></article>';
  const second = document.getElementById("dua-second")!;
  vi.spyOn(second, "getBoundingClientRect").mockReturnValue({
    top: 700,
    bottom: 900,
  } as DOMRect);
  const scroll = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 1;
  });
  const { result } = renderHook(() =>
    useReadingPosition("friday", true, true, false, null),
  );
  await waitFor(() =>
    expect(scroll).toHaveBeenCalledWith({ top: 560, behavior: "instant" }),
  );
  expect(result.current.currentDua).toBe(2);
});
it("does not reset the reading position while a dialog is open", async () => {
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const { rerender } = renderHook(
    ({ paused }) => useReadingPosition("friday", true, true, paused, null),
    { initialProps: { paused: true } },
  );
  await act(async () => {});
  expect(scroll).not.toHaveBeenCalled();
  rerender({ paused: false });
});
