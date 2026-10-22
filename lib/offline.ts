import { CONTENT_BASE, CONTENT_CACHE, CONTENT_VERSION } from "./dataUrl";
export interface OfflineManifest {
  version: string;
  resources: { url: string; sha256: string }[];
}
const manifestUrl = () =>
  new URL(CONTENT_BASE + "offline-manifest.json", location.href).href;
export async function offlineAvailable() {
  if (!("caches" in window)) return false;
  const cache = await caches.open(CONTENT_CACHE);
  const response = await cache.match(manifestUrl());
  if (!response) return false;
  const manifest = (await response.json()) as OfflineManifest;
  if (manifest.version !== CONTENT_VERSION) return false;
  const found = await Promise.all(
    manifest.resources.map((resource) =>
      cache.match(new URL(resource.url, location.href).href),
    ),
  );
  return found.every(Boolean);
}
export async function downloadOffline(
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
) {
  if (!("caches" in window) || !("serviceWorker" in navigator))
    throw new Error("unsupported");
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) throw new Error("Service worker not ready");
  const response = await fetch(manifestUrl(), { signal });
  if (!response.ok) throw new Error("Manifest missing");
  const manifest = (await response.json()) as OfflineManifest;
  if (
    manifest.version !== CONTENT_VERSION ||
    !Array.isArray(manifest.resources) ||
    !manifest.resources.length
  )
    throw new Error("Manifest mismatch");
  const stageName =
    "hza-download-" + CONTENT_VERSION + "-" + crypto.randomUUID();
  const stage = await caches.open(stageName);
  const cache = await caches.open(CONTENT_CACHE);
  try {
    onProgress(0, manifest.resources.length);
    for (let i = 0; i < manifest.resources.length; i++) {
      signal.throwIfAborted();
      const resource = manifest.resources[i];
      const url = new URL(resource.url, location.href);
      if (
        url.origin !== location.origin ||
        !url.pathname.startsWith(CONTENT_BASE)
      )
        throw new Error("Invalid asset");
      const result =
        (await cache.match(url.href)) ?? (await fetch(url.href, { signal }));
      if (!result.ok) throw new Error("Incomplete download");
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            await result.clone().arrayBuffer(),
          ),
        ),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (hash !== resource.sha256) throw new Error("Asset revision mismatch");
      await stage.put(url.href, result);
      onProgress(i + 1, manifest.resources.length);
    }
    signal.throwIfAborted();
    for (const request of await stage.keys()) {
      signal.throwIfAborted();
      await cache.put(request, (await stage.match(request))!);
    }
    // The completion marker is written last. Interrupted downloads never claim
    // a complete week; immutable URLs keep days/search/fonts on one revision.
    await cache.put(
      manifestUrl(),
      new Response(JSON.stringify(manifest), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  } finally {
    await caches.delete(stageName);
  }
}
