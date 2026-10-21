import { useEffect, useRef, useState } from "react";
import { Language } from "../types";
import { UI } from "../lib/ui";
import { downloadOffline, offlineAvailable } from "../lib/offline";
import { Icon } from "./icons";
export function OfflineDownload({ language }: { language: Language }) {
  const t = UI[language];
  const [state, setState] = useState<
    "idle" | "loading" | "saved" | "error" | "unsupported"
  >("idle");
  const [progress, setProgress] = useState([0, 1]);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    let alive = true;
    if (!("caches" in window) || !("serviceWorker" in navigator))
      setState("unsupported");
    else
      void offlineAvailable()
        .then((saved) => {
          if (alive && saved) setState("saved");
        })
        .catch(() => {});
    return () => {
      alive = false;
      controller.current?.abort();
    };
  }, []);
  const start = async () => {
    const abort = new AbortController();
    controller.current = abort;
    setState("loading");
    try {
      await downloadOffline(abort.signal, (done, total) => {
        if (!abort.signal.aborted) setProgress([done, total]);
      });
      if (!abort.signal.aborted) setState("saved");
    } catch {
      if (!abort.signal.aborted) setState("error");
    }
  };
  return (
    <section className="offline-download">
      <button
        className="primary-button"
        onClick={() => void start()}
        disabled={
          state === "loading" || state === "saved" || state === "unsupported"
        }
      >
        <Icon name={state === "saved" ? "check" : "download"} />
        {state === "loading"
          ? t.downloading
          : state === "saved"
            ? t.saved
            : t.download}
      </button>
      {state === "loading" && (
        <progress
          aria-label={t.downloading}
          value={progress[0]}
          max={progress[1]}
        />
      )}
      <p role="status">
        {state === "error"
          ? t.downloadError
          : state === "unsupported"
            ? t.offlineUnsupported
            : state === "loading"
              ? `${progress[0]} / ${progress[1]}`
              : t.downloadHint}
      </p>
    </section>
  );
}
