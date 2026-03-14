import { useState, useEffect } from "react";
import { getLiveFuelPrices, type FuelPrice } from "@/lib/data";

export function useFuelPrices() {
  const [prices, setPrices] = useState<FuelPrice[]>(getLiveFuelPrices());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(getLiveFuelPrices());
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return { prices, lastUpdate };
}
