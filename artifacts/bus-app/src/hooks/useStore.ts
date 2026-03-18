import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "/api/store";
const POLL_MS  = 20_000;

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
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    return res.ok;
  } catch {
    return false;
  }
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

  const [data, setData]     = useState<T>(() => lsRead<T>(key) ?? initial);
  const [loaded, setLoaded] = useState(false);
  const mounted   = useRef(true);
  // Track if user has written AFTER mount — prevents stale API data from overwriting fresh user input
  const userWrote = useRef(false);

  /* Load from API on mount */
  useEffect(() => {
    mounted.current = true;
    userWrote.current = false;

    apiGet<T>(key).then(result => {
      if (!mounted.current) return;

      if (result.ok) {
        const remote = result.data;

        if (!isEmpty(remote)) {
          // DB has real data
          if (!userWrote.current) {
            // No user writes yet → safe to trust DB
            setData(remote);
            lsWrite(key, remote);
          } else {
            // User already wrote something since mount → do NOT overwrite.
            // Re-push user's version to DB to ensure consistency.
            setData(prev => {
              apiSet(key, prev);
              return prev;
            });
          }
        } else {
          // DB is empty → push local data up to DB
          if (!userWrote.current) {
            const local = lsRead<T>(key);
            if (!isEmpty(local)) {
              apiSet(key, local);
              setData(local as T);
            }
          }
        }
      }
      setLoaded(true);
    });

    return () => { mounted.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* Poll: sync from other devices — NEVER wipe existing data */
  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(async () => {
      if (!mounted.current) return;
      const result = await apiGet<T>(key);
      if (!mounted.current || !result.ok) return;
      const remote = result.data;

      setData(prev => {
        // Safety: if remote is empty but we have local data → keep local, re-push to DB
        if (isEmpty(remote) && !isEmpty(prev)) {
          apiSet(key, prev);
          return prev;
        }
        if (JSON.stringify(prev) === JSON.stringify(remote)) return prev;
        lsWrite(key, remote);
        return remote;
      });
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [key, loaded]);

  /* Write: update state + localStorage + DB */
  const setState = useCallback((val: T | ((prev: T) => T)) => {
    userWrote.current = true;
    setData(prev => {
      const next = typeof val === "function" ? (val as (p: T) => T)(prev) : val;
      lsWrite(key, next);
      apiSet(key, next);
      return next;
    });
  }, [key]);

  return [data, setState, loaded];
}
