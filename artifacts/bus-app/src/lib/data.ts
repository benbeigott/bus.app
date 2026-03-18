export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  seats: number;
  type: "Reisebus" | "Stadtbus" | "Minibus" | "Doppeldecker";
  status: "active" | "standby" | "repair" | "blocked";
  driver?: string;
  lastService: string;
  fuelLevel: number;
  mileage: number;
  images?: string[];
  currentLocation?: string;
  currentLocationLat?: number;
  currentLocationLng?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
}

export interface Booking {
  id: string;
  vehicleId: string;
  date: string;
  endDate?: string;
  departureTime?: string;
  returnTime?: string;
  route: string;
  customer: string;
  price: number;
  status: "confirmed" | "pending" | "cancelled";
  seats: number;
  contact?: string;
  travelInfo?: string;
  distanceKm?: number;
  durationMin?: number;
  fromCity?: string;
  toCity?: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  createdBy?: string;
}

export interface FuelPrice {
  type: string;
  price: number;
  change: number;
  unit: string;
}

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: "v1", name: "Mercedes Tourismo", plate: "MZ-BUS-101", seats: 54, type: "Reisebus", status: "active", driver: "Hans Müller", lastService: "2026-02-10", fuelLevel: 78, mileage: 182400 },
  { id: "v2", name: "Setra S 516 HDH", plate: "MZ-BUS-102", seats: 49, type: "Reisebus", status: "active", driver: "Petra Klein", lastService: "2026-01-28", fuelLevel: 55, mileage: 241300 },
  { id: "v3", name: "MAN Lion's Coach", plate: "MZ-BUS-103", seats: 60, type: "Doppeldecker", status: "standby", driver: undefined, lastService: "2026-03-01", fuelLevel: 90, mileage: 98700 },
  { id: "v4", name: "Neoplan Cityliner", plate: "MZ-BUS-104", seats: 52, type: "Reisebus", status: "active", driver: "Kai Bauer", lastService: "2026-02-20", fuelLevel: 42, mileage: 315600 },
  { id: "v5", name: "VDL Futura FHD2", plate: "MZ-BUS-105", seats: 57, type: "Reisebus", status: "repair", driver: undefined, lastService: "2025-12-15", fuelLevel: 30, mileage: 422100 },
  { id: "v6", name: "Mercedes Sprinter", plate: "MZ-VAN-201", seats: 19, type: "Minibus", status: "active", driver: "Sarah Weber", lastService: "2026-03-08", fuelLevel: 65, mileage: 87200 },
  { id: "v7", name: "Irizar i8 Integral", plate: "MZ-BUS-106", seats: 55, type: "Reisebus", status: "standby", driver: undefined, lastService: "2026-02-05", fuelLevel: 85, mileage: 134500 },
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: "d1", name: "Hans Müller", phone: "+49 151 11223344" },
  { id: "d2", name: "Petra Klein", phone: "+49 152 22334455" },
  { id: "d3", name: "Kai Bauer", phone: "+49 153 33445566" },
  { id: "d4", name: "Sarah Weber", phone: "+49 154 44556677" },
];

export const INITIAL_BOOKINGS: Booking[] = [];

export const BASE_FUEL_PRICES: FuelPrice[] = [
  { type: "Diesel", price: 1.649, change: 0.012, unit: "€/L" },
  { type: "Benzin Super", price: 1.789, change: -0.008, unit: "€/L" },
  { type: "AdBlue", price: 0.289, change: 0.002, unit: "€/L" },
  { type: "LNG", price: 1.249, change: 0.021, unit: "€/kg" },
];

export function getLiveFuelPrices(): FuelPrice[] {
  return BASE_FUEL_PRICES.map(fp => {
    const fluctuation = (Math.random() - 0.5) * 0.02;
    return {
      ...fp,
      price: Math.round((fp.price + fluctuation) * 1000) / 1000,
      change: Math.round((fp.change + (Math.random() - 0.5) * 0.005) * 1000) / 1000,
    };
  });
}

export const PARTNERS: { id: string; code: string; name: string; role: "partner" }[] = [];

export const MASTER_CODE = "master2026";
