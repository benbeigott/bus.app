import { useState } from "react";
import { type UserSession, type Partner } from "@/App";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useFuelPrices } from "@/hooks/useFuelPrices";
import FleetOverview from "@/components/FleetOverview";
import BookingCalendar from "@/components/BookingCalendar";
import BookingTable from "@/components/BookingTable";
import FuelWidget from "@/components/FuelWidget";
import FuelAdvisor from "@/components/FuelAdvisor";
import FuelPriceTicker from "@/components/FuelPriceTicker";
import StatsBar from "@/components/StatsBar";
import DispatchPlanner from "@/components/DispatchPlanner";
import AdminPanel from "@/components/AdminPanel";
import { INITIAL_VEHICLES, INITIAL_BOOKINGS, INITIAL_DRIVERS, type Vehicle, type Booking, type Driver } from "@/lib/data";
import { DEFAULT_DEPOT, type DepotLocation } from "@/lib/depots";

interface Props {
  session: UserSession;
  onLogout: () => void;
  partners: Partner[];
  onPartnersChange: (p: Partner[]) => void;
}

type Tab = "dashboard" | "fleet" | "bookings" | "calendar" | "planung" | "verwaltung";

export default function Dashboard({ session, onLogout, partners, onPartnersChange }: Props) {
  const { time, dateStr } = useLiveClock();
  const [depot, setDepot] = useState<DepotLocation>(DEFAULT_DEPOT);
  const { prices, stations, fuelTip, lastUpdate, stationName, isLive } = useFuelPrices(depot);
  const [activeTab, setActiveTab] = useState<Tab>(session.role === "master" ? "planung" : "dashboard");
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);

  const isMaster = session.role === "master";

  const partnerTabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "fleet", label: "Flotte" },
    { id: "bookings", label: "Ausbuchungen" },
    { id: "calendar", label: "Kalender" },
  ];

  const masterTabs: { id: Tab; label: string }[] = [
    { id: "planung", label: "Planung" },
    { id: "dashboard", label: "Übersicht" },
    { id: "fleet", label: "Flotte" },
    { id: "bookings", label: "Buchungen" },
    { id: "calendar", label: "Kalender" },
    { id: "verwaltung", label: "Verwaltung" },
  ];

  const tabs = isMaster ? masterTabs : partnerTabs;

  function updateVehicle(v: Vehicle) {
    setVehicles(prev => prev.map(x => x.id === v.id ? v : x));
  }

  function handleAddVehicle(v: Vehicle) {
    setVehicles(prev => [...prev, v]);
  }

  function handleDeleteVehicle(id: string) {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }

  function handleAddPartner(p: Partner) {
    onPartnersChange([...partners, p]);
  }

  function handleDeletePartner(id: string) {
    onPartnersChange(partners.filter(p => p.id !== id));
  }

  function handleUpdatePartner(p: Partner) {
    onPartnersChange(partners.map(x => x.id === p.id ? p : x));
  }

  function handleAddDriver(d: Driver) {
    setDrivers(prev => [...prev, d]);
  }

  function handleDeleteDriver(id: string) {
    setDrivers(prev => prev.filter(d => d.id !== id));
  }

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
        {activeTab === "planung" && isMaster && (
          <div className="p-6">
            <DispatchPlanner vehicles={vehicles} bookings={bookings} onUpdateVehicle={updateVehicle} onUpdateBookings={setBookings} />
          </div>
        )}
        {activeTab === "dashboard" && (
          <div className="p-6 space-y-6">
            <StatsBar vehicles={vehicles} bookings={bookings} isMaster={isMaster} />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FleetOverview vehicles={vehicles} bookings={bookings} isMaster={isMaster} onUpdateVehicle={updateVehicle} />
              </div>
              <div>
                <FuelWidget prices={prices} lastUpdate={lastUpdate} stationName={stationName} isLive={isLive} />
              </div>
            </div>
            <div>
              <FuelAdvisor fuelTip={fuelTip} stations={stations} depot={depot} isLive={isLive} />
            </div>
            <BookingTable bookings={bookings} vehicles={vehicles} isMaster={isMaster} onUpdate={setBookings} limit={8} title="Letzte Buchungen" />
          </div>
        )}
        {activeTab === "fleet" && (
          <div className="p-6">
            <FleetOverview vehicles={vehicles} bookings={bookings} isMaster={isMaster} onUpdateVehicle={updateVehicle} expanded />
          </div>
        )}
        {activeTab === "bookings" && (
          <div className="p-6">
            <BookingTable bookings={bookings} vehicles={vehicles} isMaster={isMaster} onUpdate={setBookings} title="Alle Ausbuchungen" />
          </div>
        )}
        {activeTab === "calendar" && (
          <div className="p-6">
            <BookingCalendar vehicles={vehicles} bookings={bookings} onUpdateBookings={setBookings} isMaster={isMaster} />
          </div>
        )}
        {activeTab === "verwaltung" && isMaster && (
          <div className="p-6">
            <AdminPanel
              vehicles={vehicles}
              partners={partners}
              drivers={drivers}
              depot={depot}
              onDepotChange={setDepot}
              onAddVehicle={handleAddVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              onUpdateVehicle={updateVehicle}
              onAddPartner={handleAddPartner}
              onDeletePartner={handleDeletePartner}
              onUpdatePartner={handleUpdatePartner}
              onAddDriver={handleAddDriver}
              onDeleteDriver={handleDeleteDriver}
            />
          </div>
        )}
      </div>
    </div>
  );
}
