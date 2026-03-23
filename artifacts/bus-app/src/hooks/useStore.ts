import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "/api/store";
const POLL_MS  = 12_000; // sync every 12 seconds

/* ─── API helpers ─────────────────────────────────────────────────────── */
async function apiGet<T>(key: string): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}&t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
    });
    if (!res.ok) return { ok: false };
    const data = await res.json() as T;
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

async function apiSet(key: string, value: unknown): Promise<boolean> {
  // Retry up to 4 times so a single network hiccup doesn't lose data
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.ok) return true;
    } catch { /* retry */ }
    if (attempt < 4) await new Promise(r => setTimeout(r, 500 * attempt));
  }
  return false;
}

/* ─── localStorage helpers ────────────────────────────────────────────── */
function lsRead<T>(key: string): T | null {
  try {
    const s = localStorage.getItem(`bd_cache_${key}`);
    return s ? (JSON.parse(s) as T) : null;
  } catch { return null; }
}
function lsWrite(key: string, value: unknown) {
  try { localStorage.setItem(`bd_cache_${key}`, JSON.stringify(value)); } catch {}
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || (Array.isArray(v) && v.length === 0);
}

/* ─── Main hook ────────────────────────────────────────────────────────── */
export function useStore<T>(
  key: string,
  initial: T
): [T, (val: T | ((prev: T) => T)) => void, boolean] {

  // Start with localStorage so the UI isn't blank on first paint
  const [data, setData]     = useState<T>(() => lsRead<T>(key) ?? initial);
  const [loaded, setLoaded] = useState(false);
  const mounted     = useRef(true);
  // Timestamp of last user write — poll won't overwrite within 15s of a write
  const lastWriteTs = useRef<number>(0);

  /* ── Initial load: server is the single source of truth ── */
  useEffect(() => {
    mounted.current = true;

    apiGet<T>(key).then(result => {
      if (!mounted.current) return;

      if (result.ok) {
        const serverData = result.data;
        const localData = lsRead<T>(key);

        if (!isEmpty(serverData)) {
          // If local cache is an array with MORE entries than server,
          // the server likely missed some saves (e.g. large payload failed) → restore from local.
          if (
            Array.isArray(serverData) &&
            Array.isArray(localData) &&
            localData.length > (serverData as unknown[]).length
          ) {
            // Local has more entries → push local to server and keep local state
            apiSet(key, localData);
            lsWrite(key, localData);
            // setData not needed — state already initialized from lsRead
          } else {
            // Server has more or equal entries → server wins
            setData(serverData);
            lsWrite(key, serverData);
          }
        }
        // If server is empty (no key yet), keep local state — don't push local to server here
      }
      setLoaded(true);
    });

    return () => { mounted.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* ── Poll: sync changes from other devices ── */
  useEffect(() => {
    if (!loaded) return;

    const timer = setInterval(async () => {
      if (!mounted.current) return;

      // Skip poll if user wrote recently to avoid overwriting fresh local data
      if (Date.now() - lastWriteTs.current < 15_000) return;

      const result = await apiGet<T>(key);
      if (!mounted.current || !result.ok) return;

      const remote = result.data;

      // NEVER overwrite local data with an empty server response
      if (isEmpty(remote)) return;

      setData(prev => {
        // If data is the same, no update needed
        if (JSON.stringify(prev) === JSON.stringify(remote)) return prev;
        lsWrite(key, remote);
        return remote;
      });
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [key, loaded]);

  /* ── Write: update state + localStorage + DB atomically ── */
  const setState = useCallback((val: T | ((prev: T) => T)) => {
    lastWriteTs.current = Date.now();
    setData(prev => {
      const next = typeof val === "function" ? (val as (p: T) => T)(prev) : val;
      lsWrite(key, next);
      // Fire and forget — apiSet already has retry logic built in
      apiSet(key, next).then(ok => {
        if (!ok) {
          // If all retries failed, try one final time after 2s
          setTimeout(() => apiSet(key, next), 2000);
        }
      });
      return next;
    });
  }, [key]);

  return [data, setState, loaded];
}
