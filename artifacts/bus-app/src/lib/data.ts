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

export const INITIAL_BOOKINGS: Booking[] = [
  { id: "b1", vehicleId: "v1", date: "2026-03-15", departureTime: "08:00", returnTime: "22:00", route: "Mainz → Paris", customer: "Reiseverband Frankfurt", price: 2800, status: "confirmed", seats: 48, contact: "+49 69 123456" },
  { id: "b2", vehicleId: "v1", date: "2026-03-22", departureTime: "07:30", returnTime: "20:00", route: "Frankfurt → Amsterdam", customer: "SchulReisen GmbH", price: 3200, status: "confirmed", seats: 50 },
  { id: "b3", vehicleId: "v2", date: "2026-03-16", departureTime: "09:00", returnTime: "19:30", route: "Koblenz → München", customer: "TUI Gruppenreisen", price: 1800, status: "confirmed", seats: 45 },
  { id: "b4", vehicleId: "v2", date: "2026-03-28", endDate: "2026-03-30", departureTime: "06:00", route: "Mainz → Prag", customer: "Stadtwerke Mainz", price: 4100, status: "pending", seats: 42 },
  { id: "b5", vehicleId: "v3", date: "2026-03-19", endDate: "2026-03-21", departureTime: "07:00", route: "Darmstadt → Wien", customer: "Globetrotter AG", price: 5200, status: "confirmed", seats: 58 },
  { id: "b6", vehicleId: "v4", date: "2026-03-17", departureTime: "08:30", returnTime: "21:00", route: "Wiesbaden → Berlin", customer: "BundesParty e.V.", price: 3600, status: "confirmed", seats: 50 },
  { id: "b7", vehicleId: "v4", date: "2026-03-25", endDate: "2026-03-27", departureTime: "05:00", route: "Mainz → Barcelona", customer: "Premium Tours", price: 8900, status: "pending", seats: 48 },
  { id: "b8", vehicleId: "v6", date: "2026-03-14", departureTime: "10:00", returnTime: "16:00", route: "Mainz City Tour", customer: "Hotel Hilton Mainz", price: 650, status: "confirmed", seats: 18 },
  { id: "b9", vehicleId: "v6", date: "2026-03-20", departureTime: "06:30", returnTime: "09:00", route: "Airport Shuttle FRA", customer: "Private Buchung", price: 380, status: "confirmed", seats: 12 },
  { id: "b10", vehicleId: "v7", date: "2026-03-30", departureTime: "05:30", route: "Mainz → Rom", customer: "Kirchengemeinde St. Stephan", price: 7200, status: "pending", seats: 52 },
  { id: "b11", vehicleId: "v1", date: "2026-04-05", departureTime: "08:00", returnTime: "20:00", route: "Frankfurt → Zürich", customer: "Messe Frankfurt", price: 2100, status: "confirmed", seats: 50 },
  { id: "b12", vehicleId: "v2", date: "2026-04-12", departureTime: "07:00", returnTime: "22:00", route: "Mainz → Venedig", customer: "Kulturreisen Rhein", price: 5800, status: "confirmed", seats: 44 },
  { id: "b13", vehicleId: "v3", date: "2026-04-18", departureTime: "06:30", route: "Köln → Budapest", customer: "Reiseverband NRW", price: 6300, status: "pending", seats: 60 },
  { id: "b14", vehicleId: "v4", date: "2026-04-08", departureTime: "09:00", returnTime: "21:30", route: "Wiesbaden → Hamburg", customer: "Corporate Travel AG", price: 4400, status: "confirmed", seats: 48 },
  { id: "b15", vehicleId: "v6", date: "2026-04-15", departureTime: "14:00", returnTime: "20:00", route: "Hochzeits-Transfer Mainz", customer: "Familie Hoffmann", price: 890, status: "confirmed", seats: 18 },
];

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

export const PARTNERS = [
  { id: "MZ001", code: "bus2026", name: "Müller Reisen GmbH", role: "partner" as const },
  { id: "WI002", code: "flotte22", name: "Rhein Buspark", role: "partner" as const },
  { id: "FRA03", code: "fahrer99", name: "FrankenBus KG", role: "partner" as const },
];

export const MASTER_CODE = "master2026";
