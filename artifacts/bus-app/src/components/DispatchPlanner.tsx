import { useState, useMemo } from "react";
import { type Vehicle, type Booking } from "@/lib/data";

interface Props {
  vehicles: Vehicle[];
  bookings: Booking[];
  onUpdateVehicle: (v: Vehicle) => void;
  onUpdateBookings: (b: Booking[]) => void;
}

const TYPE_ICON: Record<string, string> = {
  Reisebus: "🚌",
  Stadtbus: "🚍",
  Minibus: "🚐",
  Doppeldecker: "🚎",
};

const BUS_IMAGES: Record<string, string> = {
  "Mercedes Tourismo":  "/buses/mercedes-tourismo.png",
  "Setra S 516 HDH":    "/buses/setra-s516.png",
  "MAN Lion's Coach":   "/buses/man-lions-coach.png",
  "Neoplan Cityliner":  "/buses/neoplan-cityliner.png",
  "VDL Futura FHD2":    "/buses/vdl-futura.png",
  "Mercedes Sprinter":  "/buses/mercedes-sprinter.png",
  "Irizar i8 Integral": "/buses/irizar-i8.png",
};

const STATUS_CONFIG: Record<Vehicle["status"], { label: string; bg: string; text: string; dot: string }> = {
  active:   { label: "Aktiv",      bg: "bg-green-500/10",  text: "text-green-400",  dot: "bg-green-400" },
  standby:  { label: "Bereit",     bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  repair:   { label: "Werkstatt",  bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-400" },
  blocked:  { label: "Gesperrt",   bg: "bg-zinc-800/60",   text: "text-zinc-500",   dot: "bg-zinc-600" },
};

// Build 30-day timeline from today
function buildDays(count = 28) {
  const days: { date: string; label: string; shortDay: string; isToday: boolean; isWeekend: boolean }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = d.getDay();
    days.push({
      date: dateStr,
      label: dd,
      shortDay: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][dayOfWeek],
      isToday: i === 0,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }
  return days;
}

export default function DispatchPlanner({ vehicles, bookings, onUpdateVehicle, onUpdateBookings }: Props) {
  const days = useMemo(() => buildDays(28), []);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<string | null>(null);

  function toggleBlock(v: Vehicle) {
    if (v.status === "repair") return;
    if (v.status === "blocked") {
      onUpdateVehicle({ ...v, status: "standby" });
    } else {
      onUpdateVehicle({ ...v, status: "blocked" });
    }
    setConfirmBlock(null);
  }

  function getBookingsForCell(vehicleId: string, date: string) {
    return bookings.filter(b => b.vehicleId === vehicleId && b.date === date && b.status !== "cancelled");
  }

  const BOOKING_COLORS: Record<Booking["status"], { bar: string; text: string }> = {
    confirmed: { bar: "bg-yellow-500",        text: "text-black" },
    pending:   { bar: "bg-yellow-500/30",     text: "text-yellow-300" },
    cancelled: { bar: "bg-zinc-700",          text: "text-zinc-400" },
  };

  // Summary stats
  const totalRevenue = bookings.filter(b => b.status === "confirmed").reduce((s, b) => s + b.price, 0);
  const blockedCount = vehicles.filter(v => v.status === "blocked").length;
  const activeCount = vehicles.filter(v => v.status === "active" || v.status === "standby").length;

  const CELL_W = 48;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Master Control</p>
          <h1 className="text-2xl font-bold text-white mt-1">Dispatch Planner</h1>
          <p className="text-xs text-zinc-600 mt-1">28-Tage-Vorschau · Klick auf Fahrzeug für Details</p>
        </div>
        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
            <p className="text-lg font-bold text-green-400">{activeCount}</p>
            <p className="text-xs text-zinc-500">Verfügbar</p>
          </div>
          <div className="px-4 py-2 bg-zinc-800/60 border border-white/5 rounded-xl text-center">
            <p className="text-lg font-bold text-zinc-400">{blockedCount}</p>
            <p className="text-xs text-zinc-500">Gesperrt</p>
          </div>
          <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
            <p className="text-lg font-bold text-yellow-400">€ {(totalRevenue / 1000).toFixed(0)}k</p>
            <p className="text-xs text-zinc-500">Umsatz</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <span className="text-xs text-zinc-600 uppercase tracking-widest">Legende:</span>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`w-2 h-2 rounded-full ${v.dot}`} />
            {v.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-3 h-2 rounded-sm bg-yellow-500 inline-block" />
          Buchung
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-3 h-2 rounded-sm bg-yellow-500/30 inline-block" />
          Ausstehend
        </div>
      </div>

      {/* Main planner table */}
      <div className="gold-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${260 + days.length * CELL_W}px` }}>

            {/* Date header */}
            <div className="flex border-b border-white/[0.06] bg-[#050505] sticky top-0 z-20">
              {/* Vehicle column header */}
              <div className="flex-shrink-0 w-64 px-4 py-3 border-r border-white/[0.05]">
                <span className="text-xs text-zinc-600 uppercase tracking-widest">Fahrzeug</span>
              </div>
              {/* Day columns */}
              {days.map(day => (
                <div
                  key={day.date}
                  style={{ width: CELL_W, minWidth: CELL_W, maxWidth: CELL_W }}
                  className={`flex-shrink-0 text-center py-2 border-r border-white/[0.03] ${day.isToday ? "bg-yellow-500/5" : day.isWeekend ? "bg-white/[0.01]" : ""}`}
                >
                  <p className={`text-[10px] font-medium ${day.isToday ? "text-yellow-400" : day.isWeekend ? "text-zinc-600" : "text-zinc-500"}`}>{day.shortDay}</p>
                  <p className={`text-xs font-bold tabular-nums ${day.isToday ? "text-yellow-400" : day.isWeekend ? "text-zinc-600" : "text-zinc-400"}`}>{day.label}</p>
                </div>
              ))}
            </div>

            {/* Vehicle rows */}
            {vehicles.map((vehicle, vIdx) => {
              const cfg = STATUS_CONFIG[vehicle.status];
              const isBlocked = vehicle.status === "blocked";
              const canBlock = vehicle.status !== "repair";

              return (
                <div
                  key={vehicle.id}
                  className={`flex border-b border-white/[0.04] group transition-colors ${isBlocked ? "opacity-60" : "hover:bg-white/[0.01]"} ${vIdx % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                >
                  {/* Vehicle info cell */}
                  <div
                    className="flex-shrink-0 w-64 px-3 py-2 border-r border-white/[0.05] cursor-pointer"
                    onClick={() => setSelectedVehicle(selectedVehicle?.id === vehicle.id ? null : vehicle)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Bus photo thumbnail */}
                        {BUS_IMAGES[vehicle.name] ? (
                          <div className="flex-shrink-0 w-16 h-10 rounded overflow-hidden border border-white/10 bg-zinc-900 relative">
                            <img
                              src={BUS_IMAGES[vehicle.name]}
                              alt={vehicle.name}
                              className="w-full h-full object-cover"
                              style={{ filter: isBlocked ? "grayscale(1) opacity(0.5)" : "none" }}
                            />
                            {/* Status dot overlay */}
                            <span className={`absolute bottom-0.5 left-0.5 w-2 h-2 rounded-full border border-black ${cfg.dot}`} />
                          </div>
                        ) : (
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate leading-tight">
                            {vehicle.name}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">{TYPE_ICON[vehicle.type]} {vehicle.plate}</p>
                        </div>
                      </div>
                      {/* Block button */}
                      {canBlock && (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmBlock(vehicle.id); }}
                          className={`flex-shrink-0 ml-2 text-[10px] px-2 py-0.5 rounded border transition-all ${
                            isBlocked
                              ? "border-green-500/30 text-green-500 hover:bg-green-500/10"
                              : "border-red-500/20 text-zinc-600 hover:border-red-500/40 hover:text-red-400 opacity-0 group-hover:opacity-100"
                          }`}
                          title={isBlocked ? "Entsperren" : "Sperren"}
                        >
                          {isBlocked ? "✓ Freig." : "Sperren"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Day cells */}
                  {days.map(day => {
                    const dayBookings = getBookingsForCell(vehicle.id, day.date);
                    return (
                      <div
                        key={day.date}
                        style={{ width: CELL_W, minWidth: CELL_W, maxWidth: CELL_W }}
                        className={`flex-shrink-0 border-r border-white/[0.03] py-1 px-0.5 relative ${
                          day.isToday ? "bg-yellow-500/[0.03]" : day.isWeekend ? "bg-white/[0.005]" : ""
                        } ${isBlocked ? "bg-zinc-900/40" : ""}`}
                      >
                        {isBlocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-px bg-zinc-800" style={{ transform: "rotate(0deg)" }} />
                          </div>
                        )}
                        {!isBlocked && dayBookings.map(b => (
                          <div
                            key={b.id}
                            className={`w-full rounded-sm px-0.5 mb-0.5 truncate ${BOOKING_COLORS[b.status].bar} ${BOOKING_COLORS[b.status].text}`}
                            style={{ fontSize: 9, lineHeight: "16px", height: 16 }}
                            title={`${b.route} — ${b.customer} — €${b.price}`}
                          >
                            {b.route.split("→")[0]?.trim() || b.route}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vehicle detail drawer */}
      {selectedVehicle && (() => {
        const v = vehicles.find(x => x.id === selectedVehicle.id)!;
        const cfg = STATUS_CONFIG[v.status];
        const vBookings = bookings
          .filter(b => b.vehicleId === v.id && b.status !== "cancelled")
          .sort((a, b) => a.date.localeCompare(b.date));
        const revenue = vBookings.filter(b => b.status === "confirmed").reduce((s, b) => s + b.price, 0);
        const fuelBarColor = v.fuelLevel > 60 ? "bg-green-500" : v.fuelLevel > 30 ? "bg-yellow-500" : "bg-red-500";

        return (
          <div className="mt-4 gold-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center text-xl`}>
                  {TYPE_ICON[v.type]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{v.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} border-current border-opacity-30`}>{cfg.label}</span>
                    <span className="text-xs text-zinc-600">{v.plate}</span>
                    <span className="text-xs text-zinc-600">{v.seats} Sitze</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {v.status !== "repair" && (
                  <button
                    onClick={() => setConfirmBlock(v.id)}
                    className={`text-xs px-4 py-2 rounded-lg border font-semibold transition-all ${
                      v.status === "blocked"
                        ? "border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20"
                        : "border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20"
                    }`}
                  >
                    {v.status === "blocked" ? "🔓 Fahrzeug freigeben" : "🔒 Fahrzeug sperren"}
                  </button>
                )}
                <button onClick={() => setSelectedVehicle(null)} className="text-xs text-zinc-600 hover:text-zinc-400 px-2">✕</button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-white/[0.02] rounded-lg p-3">
                <p className="text-xs text-zinc-600">Umsatz (bestätigt)</p>
                <p className="text-base font-bold text-yellow-400 mt-1">€ {revenue.toLocaleString("de-DE")}</p>
              </div>
              <div className="bg-white/[0.02] rounded-lg p-3">
                <p className="text-xs text-zinc-600">Fahrten gesamt</p>
                <p className="text-base font-bold text-white mt-1">{vBookings.length}</p>
              </div>
              <div className="bg-white/[0.02] rounded-lg p-3">
                <p className="text-xs text-zinc-600">Laufleistung</p>
                <p className="text-base font-bold text-white mt-1">{(v.mileage / 1000).toFixed(0)}k km</p>
              </div>
              <div className="bg-white/[0.02] rounded-lg p-3">
                <p className="text-xs text-zinc-600 mb-2">Tankfüllstand</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${fuelBarColor}`} style={{ width: `${v.fuelLevel}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400 tabular-nums">{v.fuelLevel}%</span>
                </div>
              </div>
            </div>

            {/* Bookings list */}
            {vBookings.length > 0 ? (
              <div>
                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Buchungen</p>
                <div className="space-y-2">
                  {vBookings.map(b => (
                    <div key={b.id} className={`flex items-center gap-3 p-3 rounded-lg border-l-2 ${b.status === "confirmed" ? "border-yellow-500 bg-yellow-500/5" : "border-zinc-700 bg-white/[0.02]"}`}>
                      <span className="text-xs text-zinc-500 w-24 flex-shrink-0 tabular-nums">{b.date}</span>
                      <span className="text-xs text-white font-medium flex-1">{b.route}</span>
                      <span className="text-xs text-zinc-500 hidden sm:inline">{b.customer}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === "confirmed" ? "badge-active" : "badge-standby"}`}>
                        {b.status === "confirmed" ? "Bestätigt" : "Ausstehend"}
                      </span>
                      <span className="text-xs text-yellow-400 font-semibold tabular-nums flex-shrink-0">€ {b.price.toLocaleString("de-DE")}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-600 text-center py-4">Keine Buchungen geplant</p>
            )}
          </div>
        );
      })()}

      {/* Confirm block modal */}
      {confirmBlock && (() => {
        const v = vehicles.find(x => x.id === confirmBlock)!;
        const isBlocked = v?.status === "blocked";
        return (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmBlock(null)}
          >
            <div
              className="gold-border rounded-2xl p-8 w-full max-w-sm bg-[#0a0a0a]"
              onClick={e => e.stopPropagation()}
            >
              <div className="corner-tl" /><div className="corner-tr" />
              <div className="corner-bl" /><div className="corner-br" />
              <div className="text-center mb-6">
                <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ${isBlocked ? "bg-green-500/15" : "bg-red-500/15"}`}>
                  {isBlocked ? "🔓" : "🔒"}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {isBlocked ? "Fahrzeug freigeben?" : "Fahrzeug sperren?"}
                </h3>
                <p className="text-sm text-zinc-500 mt-2">{v?.name}</p>
                {!isBlocked && (
                  <p className="text-xs text-red-400/80 mt-2">
                    Das Fahrzeug wird für alle Partner als nicht verfügbar markiert.
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmBlock(null)}
                  className="flex-1 py-3 border border-white/10 text-zinc-400 rounded-lg text-sm hover:border-white/20 transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => toggleBlock(v)}
                  className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                    isBlocked
                      ? "bg-green-500 text-black hover:bg-green-400"
                      : "bg-red-500 text-white hover:bg-red-400"
                  }`}
                >
                  {isBlocked ? "Freigeben" : "Sperren"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
