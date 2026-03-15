import { useState, useEffect, useRef } from "react";
import { type FuelPrice } from "@/lib/data";
import { type DepotLocation, DEFAULT_DEPOT } from "@/lib/depots";

const TANKERKOENIG_KEY = "6812f271-99d9-4aff-9cf3-d85bf906d2a6";
const RADIUS_KM = 25;

export interface TankerStation {
  id: string;
  name: string;
  brand: string;
  street: string;
  houseNumber: string;
  place: string;
  dist: number;
  diesel: number;
  e5: number;
  e10: number;
  isOpen: boolean;
  lat: number;
  lng: number;
}

export interface FuelTip {
  station: TankerStation;
  netSavingsEur: number;
  extraKm: number;
  extraMinutes: number;
  worthIt: boolean;
  savingsPerLiter: number;
  refuelCostSavings: number;
  extraDrivingCost: number;
  nearestStation: TankerStation;
}

const TANK_LITERS = 400;
const FUEL_PER_KM = 0.35;
const SPEED_KMH = 60;

function calcTip(stations: TankerStation[]): FuelTip | null {
  const open = stations.filter(s => s.isOpen && s.diesel > 0);
  if (open.length < 2) return null;
  const sorted = [...open].sort((a, b) => a.dist - b.dist);
  const nearest = sorted[0];
  let best: FuelTip | null = null;
  for (const s of sorted) {
    const savingsPerLiter = nearest.diesel - s.diesel;
    const refuelSavings = savingsPerLiter * TANK_LITERS;
    const extraOneWayKm = Math.max(0, s.dist - nearest.dist);
    const extraRoundTrip = extraOneWayKm * 2;
    const extraFuelUsed = extraRoundTrip * FUEL_PER_KM;
    const extraDrivingCost = extraFuelUsed * s.diesel;
    const net = refuelSavings - extraDrivingCost;
    const extraMin = Math.round((extraOneWayKm / SPEED_KMH) * 60);
    const tip: FuelTip = {
      station: s,
      netSavingsEur: Math.round(net * 100) / 100,
      extraKm: Math.round(extraOneWayKm * 10) / 10,
      extraMinutes: extraMin,
      worthIt: net > 1,
      savingsPerLiter: Math.round(savingsPerLiter * 1000) / 1000,
      refuelCostSavings: Math.round(refuelSavings * 100) / 100,
      extraDrivingCost: Math.round(extraDrivingCost * 100) / 100,
      nearestStation: nearest,
    };
    if (!best || tip.netSavingsEur > best.netSavingsEur) {
      best = tip;
    }
  }
  return best;
}

const FALLBACK_PRICES: FuelPrice[] = [
  { type: "Diesel",    price: 1.649, change: 0, unit: "€/L" },
  { type: "Super E5",  price: 1.789, change: 0, unit: "€/L" },
  { type: "Super E10", price: 1.759, change: 0, unit: "€/L" },
  { type: "AdBlue",    price: 0.289, change: 0, unit: "€/L" },
];

export function useFuelPrices(depot: DepotLocation = DEFAULT_DEPOT) {
  const [prices, setPrices] = useState<FuelPrice[]>(FALLBACK_PRICES);
  const [stations, setStations] = useState<TankerStation[]>([]);
  const [fuelTip, setFuelTip] = useState<FuelTip | null>(null);
  const [stationName, setStationName] = useState("Wird geladen…");
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const prevPrices = useRef<FuelPrice[]>([]);

  async function load() {
    try {
      const url = `https://creativecommons.tankerkoenig.de/json/list.php?lat=${depot.lat}&lng=${depot.lng}&rad=${RADIUS_KM}&sort=dist&type=all&apikey=${TANKERKOENIG_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok || !data.stations?.length) throw new Error("No stations");

      const stList: TankerStation[] = data.stations.map((s: any) => ({
        id: s.id,
        name: s.name || s.brand,
        brand: s.brand,
        street: s.street,
        houseNumber: s.houseNumber || "",
        place: s.place,
        dist: s.dist,
        diesel: s.diesel || 0,
        e5: s.e5 || 0,
        e10: s.e10 || 0,
        isOpen: s.isOpen,
        lat: s.lat,
        lng: s.lng,
      }));
      setStations(stList);

      const openStations = stList.filter(s => s.isOpen);
      const pool = openStations.length > 0 ? openStations : stList;

      const avg = (vals: number[]) => {
        const valid = vals.filter(v => v > 0);
        return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 1000) / 1000 : 0;
      };

      const newPrices: FuelPrice[] = [
        { type: "Diesel",    price: avg(pool.map(s => s.diesel)), change: 0, unit: "€/L" },
        { type: "Super E5",  price: avg(pool.map(s => s.e5)),     change: 0, unit: "€/L" },
        { type: "Super E10", price: avg(pool.map(s => s.e10)),    change: 0, unit: "€/L" },
        { type: "AdBlue",    price: 0.289,                         change: 0, unit: "€/L" },
      ].filter(p => p.price > 0);

      const withChange = newPrices.map(p => {
        const prev = prevPrices.current.find(x => x.type === p.type);
        return { ...p, change: prev ? Math.round((p.price - prev.price) * 1000) / 1000 : 0 };
      });
      prevPrices.current = withChange;
      setPrices(withChange);

      const tip = calcTip(stList);
      setFuelTip(tip);

      const nearest = pool.sort((a, b) => a.dist - b.dist)[0];
      setStationName(`Ø ${pool.length} Stationen · Depot: ${depot.city}`);
      setIsLive(true);
      setLastUpdate(new Date());
    } catch {
      setIsLive(false);
      setStationName(`Offline – ${depot.city}`);
      setLastUpdate(new Date());
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [depot.lat, depot.lng]);

  return { prices, stations, fuelTip, stationName, isLive, lastUpdate };
}
