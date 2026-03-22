import { useEffect } from "react";
import { type UserSession, type Partner } from "@/App";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useFuelPrices } from "@/hooks/useFuelPrices";
import { useState } from "react";
import FleetOverview from "@/components/FleetOverview";
import BookingCalendar from "@/components/BookingCalendar";
import BookingTable from "@/components/BookingTable";
import FuelWidget from "@/components/FuelWidget";
import FuelAdvisor from "@/components/FuelAdvisor";
import FuelPriceTicker from "@/components/FuelPriceTicker";
import StatsBar from "@/components/StatsBar";
import DispatchPlanner from "@/components/DispatchPlanner";
import AdminPanel from "@/components/AdminPanel";
import Messenger from "@/components/Messenger";
import { type Vehicle, type Booking, type Driver } from "@/lib/data";
import { DEFAULT_DEPOT, type DepotLocation } from "@/lib/depots";

interface Props {
  session: UserSession;
  onLogout: () => void;
  partners: Partner[];
  onPartnersChange: (p: Partner[]) => void;
  vehicles: Vehicle[];
  onVehiclesChange: (v: Vehicle[]) => void;
  bookings: Booking[];
  onBookingsChange: (b: Booking[]) => void;
  drivers: Driver[];
  onDriversChange: (d: Driver[]) => void;
  depot: DepotLocation;
  onDepotChange: (d: DepotLocation) => void;
}

type Tab = "dashboard" | "fleet" | "bookings" | "calendar" | "planung" | "verwaltung" | "chat";

export default function Dashboard({
  session, onLogout,
  partners, onPartnersChange,
  vehicles, onVehiclesChange,
  bookings, onBookingsChange,
  drivers, onDriversChange,
  depot, onDepotChange,
}: Props) {
  const { time, dateStr } = useLiveClock();
  const [activeTab, setActiveTab] = useState<Tab>(session.role === "master" ? "planung" : "dashboard");

  // Active vehicle for fuel advisor — use first active vehicle's location or fallback to depot
  const [fuelVehicleId, setFuelVehicleId] = useState<string>("__depot");
  const activeVehicle = vehicles.find(v => v.id === fuelVehicleId);
  const fuelDepot: DepotLocation = (activeVehicle?.currentLocationLat && activeVehicle?.currentLocationLng)
    ? { name: activeVehicle.currentLocation || activeVehicle.name, lat: activeVehicle.currentLocationLat, lng: activeVehicle.currentLocationLng }
    : depot;

  const { prices, stations, fuelTip, lastUpdate, stationName, isLive } = useFuelPrices(fuelDepot);

  const isMaster = session.role === "master";

  // Auto-update vehicle location based on booking schedule
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowStr = now.toISOString().slice(0, 10);
      const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      let changed = false;
      const updated = vehicles.map(v => {
        // Find a confirmed booking for this vehicle that has ended (endDate + returnTime <= now)
        const active = bookings.find(b =>
          b.vehicleId === v.id &&
          b.status === "confirmed" &&
          b.toCity &&
          b.toLat &&
          b.toLng &&
          ((b.endDate || b.date) < nowStr ||
           ((b.endDate || b.date) === nowStr && (b.returnTime || "23:59") <= nowTime))
        );
        if (active && active.toCity && active.toLat && active.toLng) {
          if (v.currentLocation !== active.toCity) {
            changed = true;
            return {
              ...v,
              currentLocation: active.toCity,
              currentLocationLat: active.toLat,
              currentLocationLng: active.toLng,
            };
          }
        }
        return v;
      });
      if (changed) onVehiclesChange(updated);
    }, 60_000);
    return () => clearInterval(interval);
  }, [vehicles, bookings]);

  function updateVehicle(v: Vehicle) {
    onVehiclesChange(vehicles.map(x => x.id === v.id ? v : x));
  }

  const partnerTabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "planung", label: "Gesamtplanung" },
    { id: "bookings", label: "Buchungsübersicht" },
    { id: "calendar", label: "Kalender" },
    { id: "chat", label: "💬 Chat" },
  ];

  const masterTabs: { id: Tab; label: string }[] = [
    { id: "planung", label: "Planung" },
    { id: "dashboard", label: "Übersicht" },
    { id: "fleet", label: "Flotte" },
    { id: "bookings", label: "Buchungen" },
    { id: "calendar", label: "Kalender" },
    { id: "chat", label: "💬 Chat" },
    { id: "verwaltung", label: "Verwaltung" },
  ];

  const tabs = isMaster ? masterTabs : partnerTabs;

  return (
    <div className="min-h-screen bg-black flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#050505] sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full object-cover" />
            <div className="flex items-center gap-0">
              <span className="text-xl font-bold text-white tracking-tight">busdisposition</span>
              <span className="text-xl font-bold text-yellow-500 tracking-tight">.de</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "text-yellow-500 bg-yellow-500/10 border border-yellow-500/20"
                    : tab.id === "verwaltung"
                      ? "text-yellow-600/50 hover:text-yellow-500 hover:bg-yellow-500/5"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <FuelPriceTicker prices={prices} isLive={isLive} />
          <div className="h-8 w-px bg-white/10 hidden lg:block" />
          <div className="text-right">
            <div className="text-lg font-bold text-yellow-500 tabular-nums tracking-wider leading-none">{time}</div>
            <div className="text-xs text-zinc-600 mt-0.5 leading-none hidden md:block">{dateStr}</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-600 uppercase tracking-widest">Angemeldet</p>
            <p className="text-xs font-semibold text-white">{session.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-xs border border-white/10 text-zinc-500 px-3 py-1.5 rounded hover:border-white/20 hover:text-zinc-300 transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden flex overflow-x-auto border-b border-white/[0.06] bg-[#050505]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-5 py-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === tab.id ? "text-yellow-500 border-yellow-500" : "text-zinc-500 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "planung" && (
          <div className="p-6">
            <DispatchPlanner vehicles={vehicles} bookings={bookings} onUpdateVehicle={updateVehicle} onUpdateBookings={onBookingsChange} isMaster={isMaster} />
          </div>
        )}

        {activeTab === "dashboard" && isMaster && (
          <div className="p-6 space-y-6">
            <StatsBar vehicles={vehicles} bookings={bookings} isMaster={isMaster} />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FleetOverview vehicles={vehicles} bookings={bookings} isMaster={isMaster} onUpdateVehicle={updateVehicle} />
              </div>
              <div className="space-y-4">
                <div className="gold-border rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Tankpreise für</p>
                  <select
                    value={fuelVehicleId}
                    onChange={e => setFuelVehicleId(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs outline-none focus:border-yellow-500/40 appearance-none"
                  >
                    <option value="__depot" className="bg-black">📍 Depot ({depot.name})</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id} className="bg-black">
                        🚌 {v.name} {v.currentLocation ? `· ${v.currentLocation}` : "(kein Standort)"}
                      </option>
                    ))}
                  </select>
                </div>
                <FuelWidget prices={prices} lastUpdate={lastUpdate} stationName={stationName} isLive={isLive} />
              </div>
            </div>
            <FuelAdvisor fuelTip={fuelTip} stations={stations} depot={fuelDepot} isLive={isLive} />
            <BookingTable bookings={bookings} vehicles={vehicles} isMaster={isMaster} onUpdate={onBookingsChange} limit={8} title="Letzte Buchungen" currentPartnerId={session.partnerId} />
          </div>
        )}

        {activeTab === "dashboard" && !isMaster && (
          <div className="p-6 space-y-6">
            <StatsBar vehicles={vehicles} bookings={bookings} isMaster={isMaster} />
            <FleetOverview vehicles={vehicles} bookings={bookings} isMaster={false} onUpdateVehicle={updateVehicle} expanded />
            <BookingTable bookings={bookings} vehicles={vehicles} isMaster={false} onUpdate={onBookingsChange} title="Buchungsübersicht" currentPartnerId={session.partnerId} />
          </div>
        )}

        {activeTab === "fleet" && (
          <div className="p-6">
            <FleetOverview vehicles={vehicles} bookings={bookings} isMaster={isMaster} onUpdateVehicle={updateVehicle} expanded />
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="p-6">
            <BookingTable bookings={bookings} vehicles={vehicles} isMaster={isMaster} onUpdate={onBookingsChange} title={isMaster ? "Alle Buchungen" : "Buchungsübersicht"} currentPartnerId={session.partnerId} />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="p-6">
            <BookingCalendar vehicles={vehicles} bookings={bookings} onUpdateBookings={onBookingsChange} isMaster={isMaster} currentPartnerId={session.partnerId} />
          </div>
        )}

        {activeTab === "chat" && (
          <div className="p-6">
            <Messenger session={session} partners={partners} />
          </div>
        )}

        {activeTab === "verwaltung" && isMaster && (
          <div className="p-6">
            <AdminPanel
              vehicles={vehicles}
              partners={partners}
              drivers={drivers}
              depot={depot}
              onDepotChange={onDepotChange}
              onAddVehicle={v => onVehiclesChange([...vehicles, v])}
              onDeleteVehicle={id => onVehiclesChange(vehicles.filter(v => v.id !== id))}
              onUpdateVehicle={updateVehicle}
              onAddPartner={p => onPartnersChange([...partners, p])}
              onDeletePartner={id => onPartnersChange(partners.filter(p => p.id !== id))}
              onUpdatePartner={p => onPartnersChange(partners.map(x => x.id === p.id ? p : x))}
              onAddDriver={d => onDriversChange([...drivers, d])}
              onDeleteDriver={id => onDriversChange(drivers.filter(d => d.id !== id))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
