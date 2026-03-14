import { useState } from "react";
import { type UserSession } from "@/App";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useFuelPrices } from "@/hooks/useFuelPrices";
import FleetOverview from "@/components/FleetOverview";
import BookingCalendar from "@/components/BookingCalendar";
import BookingTable from "@/components/BookingTable";
import FuelWidget from "@/components/FuelWidget";
import StatsBar from "@/components/StatsBar";
import { INITIAL_VEHICLES, INITIAL_BOOKINGS, type Vehicle, type Booking } from "@/lib/data";

interface Props {
  session: UserSession;
  onLogout: () => void;
}

type Tab = "dashboard" | "fleet" | "bookings" | "calendar";

export default function Dashboard({ session, onLogout }: Props) {
  const { time, dateStr } = useLiveClock();
  const { prices, lastUpdate } = useFuelPrices();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "fleet", label: "Flotte" },
    { id: "bookings", label: "Ausbuchungen" },
    { id: "calendar", label: "Kalender" },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#050505] sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-white tracking-tight">bus</span>
            <span className="text-2xl font-bold text-yellow-500 tracking-tight">.app</span>
          </div>
          {session.role === "master" && (
            <span className="text-xs bg-yellow-500/15 text-yellow-500 border border-yellow-500/30 px-2.5 py-1 rounded-full font-semibold tracking-wide">
              👑 MASTER
            </span>
          )}
          <div className="hidden md:flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "text-yellow-500 bg-yellow-500/10 border border-yellow-500/20"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Live clock */}
          <div className="text-right">
            <div className="text-lg font-bold text-yellow-500 tabular-nums tracking-wider leading-none">
              {time}
            </div>
            <div className="text-xs text-zinc-600 mt-0.5 leading-none hidden md:block">{dateStr}</div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="text-right">
            <p className="text-xs text-zinc-600 uppercase tracking-widest">Angemeldet als</p>
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

      {/* Mobile tab nav */}
      <div className="md:hidden flex overflow-x-auto border-b border-white/[0.06] bg-[#050505]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-5 py-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? "text-yellow-500 border-yellow-500"
                : "text-zinc-500 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "dashboard" && (
          <div className="p-6 space-y-6">
            <StatsBar vehicles={vehicles} bookings={bookings} />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FleetOverview vehicles={vehicles} bookings={bookings} isMaster={session.role === "master"} onUpdateVehicle={(v) => setVehicles(prev => prev.map(x => x.id === v.id ? v : x))} />
              </div>
              <div>
                <FuelWidget prices={prices} lastUpdate={lastUpdate} />
              </div>
            </div>
            <BookingTable bookings={bookings} vehicles={vehicles} isMaster={session.role === "master"} onUpdate={setBookings} limit={8} title="Letzte Buchungen" />
          </div>
        )}
        {activeTab === "fleet" && (
          <div className="p-6">
            <FleetOverview vehicles={vehicles} bookings={bookings} isMaster={session.role === "master"} onUpdateVehicle={(v) => setVehicles(prev => prev.map(x => x.id === v.id ? v : x))} expanded />
          </div>
        )}
        {activeTab === "bookings" && (
          <div className="p-6">
            <BookingTable
              bookings={bookings}
              vehicles={vehicles}
              isMaster={session.role === "master"}
              onUpdate={setBookings}
              title="Alle Ausbuchungen"
            />
          </div>
        )}
        {activeTab === "calendar" && (
          <div className="p-6">
            <BookingCalendar vehicles={vehicles} bookings={bookings} onUpdateBookings={setBookings} isMaster={session.role === "master"} />
          </div>
        )}
      </div>
    </div>
  );
}
