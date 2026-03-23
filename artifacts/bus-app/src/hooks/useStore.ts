import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "/api/store";
const POLL_MS  = 5_000;  // sync every 5 seconds — all browsers always up to date

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

/* ─── localStorage helpers (instant-paint cache only) ─────────────────── */
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
  const mounted    = useRef(true);
  // After a write, hold off polling for 5s so the write isn't immediately overwritten
  const lastWriteTs = useRef<number>(0);

  /* ── Apply server data ─────────────────────────────────────────────── */
  function applyServer(serverData: T) {
    const localData = lsRead<T>(key);

    // One-time recovery: if localStorage has MORE array entries than server,
    // the server missed some saves (large payload issue) — push local to server.
    if (
      Array.isArray(serverData) &&
      Array.isArray(localData) &&
      (localData as unknown[]).length > (serverData as unknown[]).length
    ) {
      apiSet(key, localData);
      lsWrite(key, localData);
      return; // keep current state (already initialized from localStorage)
    }

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
      if (result.ok && !isEmpty(result.data)) applyServer(result.data);
      setLoaded(true);
    });

    return () => { mounted.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* ── Poll every 5 seconds — keeps all browsers in sync ─────────────── */
  useEffect(() => {
    if (!loaded) return;

    const timer = setInterval(async () => {
      if (!mounted.current) return;
      if (Date.now() - lastWriteTs.current < 5_000) return;

      const result = await apiGet<T>(key);
      if (!mounted.current || !result.ok) return;
      if (!isEmpty(result.data)) applyServer(result.data);
    }, POLL_MS);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, loaded]);

  /* ── Write: state + localStorage + server (always) ─────────────────── */
  const setState = useCallback((val: T | ((prev: T) => T)) => {
    lastWriteTs.current = Date.now();
    setData(prev => {
      const next = typeof val === "function" ? (val as (p: T) => T)(prev) : val;
      lsWrite(key, next);
      apiSet(key, next).then(ok => {
        if (!ok) setTimeout(() => apiSet(key, next), 2_000);
      });
      return next;
    });
  }, [key]);

  return [data, setState, loaded];
}
