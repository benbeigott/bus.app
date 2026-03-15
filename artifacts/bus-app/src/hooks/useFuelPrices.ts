import { useState, useEffect, useRef } from "react";
import { type FuelPrice } from "@/lib/data";

const TANKERKOENIG_KEY = "6812f271-99d9-4aff-9cf3-d85bf906d2a6";
const LAT = 49.9929;
const LNG = 8.2473;
const RADIUS = 10;

interface TankerStation {
  id: string;
  name: string;
  brand: string;
  dist: number;
  diesel?: number;
  e5?: number;
  e10?: number;
  isOpen: boolean;
}

interface TankerResult {
  prices: FuelPrice[];
  stationName: string;
  isLive: boolean;
}

async function fetchTankerKoenig(): Promise<TankerResult> {
  const url = `https://creativecommons.tankerkoenig.de/json/list.php?lat=${LAT}&lng=${LNG}&rad=${RADIUS}&sort=dist&type=all&apikey=${TANKERKOENIG_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.ok || !data.stations?.length) throw new Error("No stations");

  const open = (data.stations as TankerStation[]).filter(s => s.isOpen);
  const pool = open.length > 0 ? open : (data.stations as TankerStation[]);

  const avg = (vals: (number | undefined)[]) => {
    const valid = vals.filter((v): v is number => typeof v === "number" && v > 0);
    return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 1000) / 1000 : null;
  };

  const dieselAvg = avg(pool.map(s => s.diesel));
  const e5Avg = avg(pool.map(s => s.e5));
  const e10Avg = avg(pool.map(s => s.e10));

  const prices: FuelPrice[] = [];
  if (dieselAvg) prices.push({ type: "Diesel", price: dieselAvg, change: 0, unit: "€/L" });
  if (e5Avg)     prices.push({ type: "Super E5",  price: e5Avg,     change: 0, unit: "€/L" });
  if (e10Avg)    prices.push({ type: "Super E10", price: e10Avg,    change: 0, unit: "€/L" });
  prices.push({ type: "AdBlue", price: 0.289, change: 0, unit: "€/L" });

  const nearest = pool[0];
  const stationName = `Ø ${pool.length} Stationen · ${nearest?.brand || "Mainz"} ${nearest ? `${nearest.dist.toFixed(1)} km` : ""}`;

  return { prices, stationName, isLive: true };
}

const FALLBACK: FuelPrice[] = [
  { type: "Diesel",    price: 1.649, change: 0, unit: "€/L" },
  { type: "Super E5",  price: 1.789, change: 0, unit: "€/L" },
  { type: "Super E10", price: 1.759, change: 0, unit: "€/L" },
  { type: "AdBlue",    price: 0.289, change: 0, unit: "€/L" },
];

export function useFuelPrices() {
  const [prices, setPrices] = useState<FuelPrice[]>(FALLBACK);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [stationName, setStationName] = useState("Wird geladen…");
  const [isLive, setIsLive] = useState(false);
  const prevPrices = useRef<FuelPrice[]>([]);

  async function load() {
    try {
      const result = await fetchTankerKoenig();
      const withChange = result.prices.map(p => {
        const prev = prevPrices.current.find(x => x.type === p.type);
        return { ...p, change: prev ? Math.round((p.price - prev.price) * 1000) / 1000 : 0 };
      });
      prevPrices.current = withChange;
      setPrices(withChange);
      setStationName(result.stationName);
      setIsLive(true);
      setLastUpdate(new Date());
    } catch {
      setIsLive(false);
      setStationName("Offline – Schätzwerte");
      setLastUpdate(new Date());
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { prices, lastUpdate, stationName, isLive };
}
