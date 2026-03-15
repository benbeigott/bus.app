import { type Vehicle, type Booking } from "@/lib/data";

interface Props {
  vehicles: Vehicle[];
  bookings: Booking[];
  isMaster: boolean;
}

export default function StatsBar({ vehicles, bookings, isMaster }: Props) {
  const activeVehicles   = vehicles.filter(v => v.status === "active").length;
  const standbyVehicles  = vehicles.filter(v => v.status === "standby").length;
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
  const totalRevenue     = bookings.filter(b => b.status === "confirmed").reduce((sum, b) => sum + b.price, 0);
  const pendingBookings  = bookings.filter(b => b.status === "pending").length;
  const inRepair         = vehicles.filter(v => v.status === "repair").length;
  const totalSeats       = vehicles.reduce((sum, v) => sum + v.seats, 0);
  const today            = new Date().toISOString().split("T")[0];
  const todayBookings    = bookings.filter(b => b.date === today && b.status === "confirmed").length;

  const masterStats = [
    { label: "Fahrzeuge aktiv",        value: `${activeVehicles}/${vehicles.length}`, sub: `${inRepair} Werkstatt · ${standbyVehicles} Standby`, color: "text-green-400" },
    { label: "Bestätigte Buchungen",   value: confirmedBookings,                       sub: `${pendingBookings} ausstehend`,                       color: "text-yellow-400" },
    { label: "Gesamtumsatz",           value: `€ ${totalRevenue.toLocaleString("de-DE")}`, sub: "Bestätigte Fahrten",                             color: "text-yellow-500" },
    { label: "Sitzplätze gesamt",      value: totalSeats,                              sub: "Gesamtkapazität Flotte",                              color: "text-blue-400"  },
  ];

  const partnerStats = [
    { label: "Fahrzeuge aktiv",     value: `${activeVehicles}/${vehicles.length}`, sub: `${inRepair} Werkstatt · ${standbyVehicles} Standby`, color: "text-green-400"  },
    { label: "Fahrten bestätigt",   value: confirmedBookings,                       sub: `${pendingBookings} ausstehend`,                       color: "text-yellow-400" },
    { label: "Fahrten heute",       value: todayBookings,                           sub: "Für heute eingeplant",                                color: "text-blue-400"   },
    { label: "Sitzplätze gesamt",   value: totalSeats,                              sub: "Gesamtkapazität Flotte",                              color: "text-zinc-300"   },
  ];

  const stats = isMaster ? masterStats : partnerStats;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="gold-border rounded-xl p-5 relative">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{stat.label}</p>
          <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
          <p className="text-xs text-zinc-600 mt-1">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}
