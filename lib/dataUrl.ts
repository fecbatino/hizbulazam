export const CONTENT_VERSION = import.meta.env.VITE_CONTENT_VERSION || "dev";
export const CONTENT_CACHE = "hza-content-v1";
export const CONTENT_BASE =
  (import.meta.env.BASE_URL || "/") + "assets/content/" + CONTENT_VERSION + "/";
export function dataUrl(file: string) {
  return import.meta.env.PROD
    ? CONTENT_BASE + file
    : (import.meta.env.BASE_URL || "/") + "data/" + file;
}
