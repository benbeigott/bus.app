import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE   = "/api/store";
const POLL_MS    = 5_000;
const WRITE_HOLD = 30_000;

/* ─── Wipe ALL local cache on every startup — DB is always the only truth ── */
(function wipeAllLocalCache() {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith("bd_")) localStorage.removeItem(k);
    }
  } catch { /* private/incognito — ignore */ }
})();

/* ─── API helpers ─────────────────────────────────────────────────────── */
async function apiGet<T>(key: string): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}&t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
    });
    if (!res.ok) return { ok: false };
    return { ok: true, data: await res.json() as T };
  } catch {
    return { ok: false };
  }
}

async function apiSet(key: string, value: unknown): Promise<boolean> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.ok) return true;
    } catch { /* retry */ }
    if (attempt < 4) await new Promise(r => setTimeout(r, 400 * attempt));
  }
  return false;
}

/* ─── Main hook — DB is the ONLY source of truth, never localStorage ──── */
export function useStore<T>(
  key: string,
  initial: T
): [T, (val: T | ((prev: T) => T)) => void, boolean] {

  // Always start with empty initial — NEVER read from localStorage
  const [data, setData]     = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const mounted       = useRef(true);
  const lastWriteTs   = useRef<number>(0);
  const pendingWrites = useRef<number>(0);

  /* ── Load from DB on startup ───────────────────────────────────────── */
  useEffect(() => {
    mounted.current = true;

    apiGet<T>(key).then(result => {
      if (!mounted.current) return;
      if (result.ok) setData(result.data);
      setLoaded(true);
    });

    return () => { mounted.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* ── Poll every 5s — DB always wins ───────────────────────────────── */
  useEffect(() => {
    if (!loaded) return;

    const timer = setInterval(async () => {
      if (!mounted.current) return;
      if (pendingWrites.current > 0) return;
      if (Date.now() - lastWriteTs.current < WRITE_HOLD) return;

      const result = await apiGet<T>(key);
      if (!mounted.current || !result.ok) return;
      setData(prev => {
        if (JSON.stringify(prev) === JSON.stringify(result.data)) return prev;
        return result.data;
      });
    }, POLL_MS);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, loaded]);

  /* ── Write: save to DB immediately ────────────────────────────────── */
  const setState = useCallback((val: T | ((prev: T) => T)) => {
    lastWriteTs.current = Date.now();
    pendingWrites.current++;

    setData(prev => {
      const next = typeof val === "function" ? (val as (p: T) => T)(prev) : val;

      console.log(`[Store] Schreibe '${key}': ${JSON.stringify(next).length} Zeichen`);

      apiSet(key, next).then(ok => {
        pendingWrites.current = Math.max(0, pendingWrites.current - 1);
        if (!ok) {
          console.warn(`[Store] Schreiben fehlgeschlagen für '${key}', retry in 3s`);
          pendingWrites.current++;
          setTimeout(() => {
            apiSet(key, next).finally(() => {
              pendingWrites.current = Math.max(0, pendingWrites.current - 1);
            });
          }, 3_000);
        } else {
          console.log(`[Store] '${key}' erfolgreich in DB gespeichert`);
        }
      });

      return next;
    });
  }, [key]);

  return [data, setState, loaded];
}
