import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "/api/store";
const POLL_INTERVAL = 8000;

async function apiGet<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}?key=${key}`);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch { return null; }
}

async function apiPost(key: string, value: unknown): Promise<boolean> {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    return res.ok;
  } catch { return false; }
}

function lsGet<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(`bd_${key}`);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch { return fallback; }
}

function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(`bd_${key}`, JSON.stringify(value)); } catch {}
}

export function useStore<T>(key: string, initial: T): [T, (val: T | ((prev: T) => T)) => void, boolean] {
  const [data, setData] = useState<T>(() => lsGet(key, initial));
  const [synced, setSynced] = useState(false);
  const pendingRef = useRef<T | null>(null);
  const isMounted = useRef(true);

  // Load from API on mount
  useEffect(() => {
    isMounted.current = true;
    apiGet<T>(key).then(remote => {
      if (!isMounted.current) return;
      if (remote !== null && Array.isArray(remote) && (remote as unknown[]).length >= 0) {
        const local = lsGet<T>(key, initial);
        // Use remote if it has data, otherwise keep local (migration: push local to remote)
        if (Array.isArray(remote) && remote.length === 0 && Array.isArray(local) && local.length > 0) {
          // Push local data to remote
          apiPost(key, local);
          setData(local);
        } else {
          setData(remote);
          lsSet(key, remote);
        }
      }
      setSynced(true);
    });
    return () => { isMounted.current = false; };
  }, [key]);

  // Poll for remote changes
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!isMounted.current) return;
      const remote = await apiGet<T>(key);
      if (remote !== null && isMounted.current) {
        setData(prev => {
          const prevStr = JSON.stringify(prev);
          const remoteStr = JSON.stringify(remote);
          if (prevStr !== remoteStr) {
            lsSet(key, remote);
            return remote;
          }
          return prev;
        });
      }
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [key]);

  const setStored = useCallback((val: T | ((prev: T) => T)) => {
    setData(prev => {
      const next = typeof val === "function" ? (val as (p: T) => T)(prev) : val;
      lsSet(key, next);
      // Push to API immediately
      apiPost(key, next);
      return next;
    });
  }, [key]);

  return [data, setStored, synced];
}
