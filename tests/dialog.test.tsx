import React from "react";
import { NOTHING_HIDDEN } from "../lib/hidden";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SettingsModal } from "../components/SettingsModal";
const settings = {
  showFavorites: true,
  showShare: true,
  showTranslation: true,
  arabicFontSize: 1.9,
  translationFontSize: 1,
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("open/close uses a consistent hook order and restores scroll and focus", () => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 1;
  });
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
    { width: 10, height: 10 },
  ] as unknown as DOMRectList);
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const opener = document.createElement("button");
  document.body.append(opener);
  opener.focus();
  const props = {
    onClose: vi.fn(),
    onSettingsChange: vi.fn(),
    theme: "system" as const,
    onThemeChange: vi.fn(),
    hidden: NOTHING_HIDDEN,
    onHiddenTypeChange: vi.fn(),
    onShowAll: vi.fn(),
    language: "de" as const,
    settings,
  };
  const view = render(<SettingsModal {...props} isOpen={false} />);
  view.rerender(<SettingsModal {...props} isOpen />);
  expect(document.body.style.position).toBe("fixed");
  const slider = screen.getByLabelText("Arabische Schriftgröße");
  act(() => slider.focus());
  view.rerender(
    <SettingsModal
      {...props}
      onClose={() => {}}
      settings={{ ...settings, arabicFontSize: 2 }}
      isOpen
    />,
  );
  expect(slider).toHaveFocus();
  view.rerender(<SettingsModal {...props} isOpen={false} />);
  expect(document.body.style.position).toBe("");
  expect(opener).toHaveFocus();
  expect(scroll).toHaveBeenCalled();
  expect(errors).not.toHaveBeenCalled();
  opener.remove();
});
it("Escape closes once and Tab cycles inside the dialog", () => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 1;
  });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
    { width: 10, height: 10 },
  ] as unknown as DOMRectList);
  const close = vi.fn();
  render(
    <SettingsModal
      isOpen
      onClose={close}
      settings={settings}
      onSettingsChange={() => {}}
      theme="system"
      onThemeChange={() => {}}
      hidden={NOTHING_HIDDEN}
      onHiddenTypeChange={() => {}}
      onShowAll={() => {}}
      language="de"
    />,
  );
  const dialog = screen.getByRole("dialog");
  const first = screen.getByRole("button", { name: "Schließen" });
  act(() => first.focus());
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  expect(document.activeElement).not.toBe(first);
  expect(dialog).toContainElement(document.activeElement as HTMLElement);
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(close).toHaveBeenCalledTimes(1);
});
