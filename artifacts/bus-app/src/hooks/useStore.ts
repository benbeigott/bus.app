import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE     = "/api/store";
const POLL_MS      = 5_000;   // check server every 5s
const WRITE_HOLD   = 30_000;  // after any write, pause polling for 30s (images can be large)

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

/* ─── localStorage helpers ─────────────────────────────────────────────── */
function lsRead<T>(key: string): T | null {
  try {
    const s = localStorage.getItem(`bd_${key}`);
    return s ? (JSON.parse(s) as T) : null;
  } catch { return null; }
}
function lsWrite(key: string, value: unknown) {
  try { localStorage.setItem(`bd_${key}`, JSON.stringify(value)); } catch {}
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
  const mounted         = useRef(true);
  const lastWriteTs     = useRef<number>(0);
  const pendingWrites   = useRef<number>(0); // block poll while upload is in flight

  /* ── Apply server data — server wins (used by polls) ──────────────── */
  function applyServer(serverData: T) {
    setData(prev => {
      if (JSON.stringify(prev) === JSON.stringify(serverData)) return prev;
      lsWrite(key, serverData);
      return serverData;
    });
  }

  /* ── Initial load ──────────────────────────────────────────────────── */
  useEffect(() => {
    mounted.current = true;

    apiGet<T>(key).then(result => {
      if (!mounted.current) return;

      if (result.ok && !isEmpty(result.data)) {
        const serverData = result.data;
        const localData  = lsRead<T>(key);

        // Startup-only recovery: if the browser has MORE array items than the server,
        // the extra items likely failed to save (old body-limit bug, network hiccup, etc.)
        // → push local to server so nothing is lost.
        //
        // We compare ITEM COUNT (not bytes), so vehicle photos never cause false positives.
        //
        // Polls never apply this logic — they always trust the server.
        // This fires exactly once per page load, before any poll starts.
        const localCount  = Array.isArray(localData)  ? (localData  as unknown[]).length : -1;
        const serverCount = Array.isArray(serverData) ? (serverData as unknown[]).length : -1;

        if (localCount > serverCount) {
          // Local has more items → push to server, keep local state
          apiSet(key, localData);
          lsWrite(key, localData);
          // setState not needed — already initialized from lsRead in useState
        } else {
          // Server has same or more items → server wins
          applyServer(serverData);
        }
      }

      setLoaded(true);
    });

    return () => { mounted.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* ── Poll every 5s — server always wins, blocked during/after writes ── */
  useEffect(() => {
    if (!loaded) return;

    const timer = setInterval(async () => {
      if (!mounted.current) return;
      if (pendingWrites.current > 0) return;
      if (Date.now() - lastWriteTs.current < WRITE_HOLD) return;

      const result = await apiGet<T>(key);
      if (!mounted.current || !result.ok) return;
      if (!isEmpty(result.data)) applyServer(result.data);
    }, POLL_MS);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, loaded]);

  /* ── Write: update state + localStorage + server ───────────────────── */
  const setState = useCallback((val: T | ((prev: T) => T)) => {
    lastWriteTs.current = Date.now();
    setData(prev => {
      const next = typeof val === "function" ? (val as (p: T) => T)(prev) : val;
      lsWrite(key, next);

      pendingWrites.current++;
      apiSet(key, next).then(ok => {
        pendingWrites.current = Math.max(0, pendingWrites.current - 1);
        if (!ok) {
          pendingWrites.current++;
          setTimeout(() => {
            apiSet(key, next).finally(() => {
              pendingWrites.current = Math.max(0, pendingWrites.current - 1);
            });
          }, 3_000);
        }
      });

      return next;
    });
  }, [key]);

  return [data, setState, loaded];
}
