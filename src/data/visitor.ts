const KEY = "qichi-visitor";

/** A stable per-browser id so views and likes can be deduplicated without a login. */
export function visitor(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const created = "randomUUID" in crypto ? crypto.randomUUID() : "v-" + Math.random().toString(36).slice(2);
    window.localStorage.setItem(KEY, created);
    return created;
  } catch {
    return "";
  }
}
