import { useState, useEffect, useCallback, useRef } from "react";

// On Vercel: calls /api/store  (same origin)
// On Replit dev: also calls /api/store — but there the Vercel function isn't
// running, so it falls back to localStorage only in dev.
const API_BASE = "/api/store";
const POLL_MS  = 10_000;

/* ─── API helpers ─────────────────────────────────────────────────────── */
async function apiGet<T>(key: string): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, { cache: "no-store" });
    if (!res.ok) return { ok: false };
    const data = await res.json() as T;
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

async function apiSet(key: string, value: unknown): Promise<boolean> {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ─── localStorage helpers (fallback only) ────────────────────────────── */
function lsRead<T>(key: string): T | null {
  try {
    const s = localStorage.getItem(`bd_cache_${key}`);
    return s ? (JSON.parse(s) as T) : null;
  } catch { return null; }
}
function lsWrite(key: string, value: unknown) {
  try { localStorage.setItem(`bd_cache_${key}`, JSON.stringify(value)); } catch {}
}

/* ─── Main hook ────────────────────────────────────────────────────────── */
export function useStore<T>(
  key: string,
  initial: T
): [T, (val: T | ((prev: T) => T)) => void, boolean] {

  // Start immediately from the local cache if available, else initial
  const [data, setData]     = useState<T>(() => lsRead<T>(key) ?? initial);
  const [loaded, setLoaded] = useState(false);
  const mounted = useRef(true);

  /* Load from API on mount — DB is the single source of truth */
  useEffect(() => {
    mounted.current = true;

    apiGet<T>(key).then(result => {
      if (!mounted.current) return;
      if (result.ok) {
        // Only replace with API data if it's non-null/non-empty,
        // OR if we have no local data at all.
        const remote = result.data;
        const isEmpty =
          remote === null ||
          remote === undefined ||
          (Array.isArray(remote) && (remote as unknown[]).length === 0);

        if (!isEmpty) {
          // DB has data → always trust the DB
          setData(remote);
          lsWrite(key, remote);
        } else {
          // DB is empty → push local data to DB so it survives next load
          const local = lsRead<T>(key);
          if (local !== null) {
            apiSet(key, local); // persist local → DB
            setData(local);
          }
          // else: stay with `initial`
        }
      }
      // API failed → stay with local cache, no overwrite
      setLoaded(true);
    });

    return () => { mounted.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* Poll for changes from other devices */
  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(async () => {
      if (!mounted.current) return;
      const result = await apiGet<T>(key);
      if (!mounted.current || !result.ok) return;
      const remote = result.data;
      setData(prev => {
        if (JSON.stringify(prev) === JSON.stringify(remote)) return prev;
        lsWrite(key, remote);
        return remote;
      });
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [key, loaded]);

  /* Write: update state + local cache + DB atomically */
  const setState = useCallback((val: T | ((prev: T) => T)) => {
    setData(prev => {
      const next = typeof val === "function" ? (val as (p: T) => T)(prev) : val;
      lsWrite(key, next);
      apiSet(key, next); // fire-and-forget
      return next;
    });
  }, [key]);

  return [data, setState, loaded];
}
