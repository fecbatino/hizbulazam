import { useCallback, useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Language } from "../types";
import { UI } from "../lib/ui";

export function UpdateNotice({
  language,
  onBeforeUpdate,
}: {
  language: Language;
  onBeforeUpdate: () => void;
}) {
  const accepted = useRef(false);
  const reload = useCallback(() => {
    if (!accepted.current) return;
    accepted.current = false;
    window.location.reload();
  }, []);
  const {
    needRefresh: [refresh, setRefresh],
    updateServiceWorker,
  } = useRegisterSW({ onNeedReload: reload });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Workbox may classify an update from another tab or a manual check as
    // external. Accepting it still needs a reload once the controller changes.
    navigator.serviceWorker.addEventListener("controllerchange", reload);
    return () =>
      navigator.serviceWorker.removeEventListener("controllerchange", reload);
  }, [reload]);
  const t = UI[language];
  if (!refresh) return null;
  const update = async () => {
    onBeforeUpdate();
    accepted.current = true;
    try {
      await updateServiceWorker(true);
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.waiting) reload();
    } catch {
      accepted.current = false;
      setFailed(true);
    }
  };
  return (
    <aside data-dialog-background className="update-notice" role="status">
      <p>{failed ? t.loadError : t.update}</p>
      <button className="primary-button" onClick={() => void update()}>
        {t.updateNow}
      </button>
      <button onClick={() => setRefresh(false)}>{t.later}</button>
    </aside>
  );
}
