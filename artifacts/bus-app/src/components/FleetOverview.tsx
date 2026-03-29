import { useState } from "react";
import { type Vehicle, type Booking } from "@/lib/data";

interface Props {
  vehicles: Vehicle[];
  bookings: Booking[];
  isMaster: boolean;
  onUpdateVehicle: (v: Vehicle) => void;
  expanded?: boolean;
}

const STATUS_LABELS: Record<Vehicle["status"], string> = {
  active: "Aktiv",
  standby: "Bereit",
  repair: "Werkstatt",
  blocked: "Gesperrt",
};

const STATUS_BADGE: Record<Vehicle["status"], string> = {
  active: "badge-active",
  standby: "badge-standby",
  repair: "badge-repair",
  blocked: "bg-zinc-800 text-zinc-500 border border-zinc-700",
};

export default function FleetOverview({ vehicles, bookings, isMaster, onUpdateVehicle, expanded }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDriver, setEditDriver] = useState("");

  function startEdit(v: Vehicle) {
    setEditingId(v.id);
    setEditDriver(v.driver || "");
  }

  function saveEdit(v: Vehicle) {
    onUpdateVehicle({ ...v, driver: editDriver || undefined });
    setEditingId(null);
  }

  function toggleStatus(v: Vehicle) {
    if (!isMaster) return;
    if (v.status === "blocked" || v.status === "repair") return;
    const next: Vehicle["status"] = v.status === "active" ? "standby" : "active";
    onUpdateVehicle({ ...v, status: next });
  }

  const visibleVehicles = expanded ? vehicles : vehicles.slice(0, 6);

  return (
    <div className="gold-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Fahrzeugflotte</p>
          <p className="text-base font-semibold text-white mt-0.5">Übersicht Flotte</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-zinc-500">{vehicles.filter(v => v.status === "active").length} aktiv</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-500">{vehicles.length} gesamt</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {visibleVehicles.map(v => {
          const todayBookings = bookings.filter(b => b.vehicleId === v.id && b.status !== "cancelled");
          const nextBooking = todayBookings.sort((a, b) => a.date.localeCompare(b.date))[0];
          const fuelBarColor = v.fuelLevel > 60 ? "bg-green-500" : v.fuelLevel > 30 ? "bg-yellow-500" : "bg-red-500";

          return (
            <div key={v.id} className="bg-white/[0.02] border border-white/[0.04] rounded-lg hover:border-yellow-500/20 transition-all overflow-hidden">
              {/* Bus photo */}
              <div className="w-full bg-zinc-950 overflow-hidden relative" style={{ aspectRatio: "16/9" }}>
                {v.images?.[0] ? (
                  <img
                    src={v.images[0]}
                    alt={v.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="1" y="6" width="22" height="13" rx="2" />
                      <path d="M1 10h22" />
                      <circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2 flex items-end justify-between">
                  <span className="text-xs font-bold text-white drop-shadow leading-tight truncate max-w-[70%]">{v.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[v.status]}`}>
                    {STATUS_LABELS[v.status]}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded truncate">{v.plate}</span>
                  <span className="text-[10px] text-zinc-600">{v.seats} Sitze</span>
                </div>

                {/* Fuel bar */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${fuelBarColor}`} style={{ width: `${v.fuelLevel}%` }} />
                  </div>
                  <span className="text-[10px] text-zinc-600 w-7 text-right">{v.fuelLevel}%</span>
                </div>

                {/* Driver / edit */}
                {editingId === v.id ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="text"
                      value={editDriver}
                      onChange={e => setEditDriver(e.target.value)}
                      placeholder="Fahrer"
                      className="text-[10px] bg-black border border-yellow-500/30 rounded px-1.5 py-0.5 text-white outline-none flex-1 min-w-0"
                      autoFocus
                    />
                    <button onClick={() => saveEdit(v)} className="text-[10px] text-yellow-500 hover:text-yellow-400">✓</button>
                    <button onClick={() => setEditingId(null)} className="text-[10px] text-zinc-500">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] truncate ${v.driver ? "text-zinc-400" : "text-zinc-600 italic"} ${isMaster ? "cursor-pointer hover:text-yellow-500" : ""}`}
                      onClick={() => isMaster && startEdit(v)}
                    >
                      {v.driver ? `👤 ${v.driver}` : isMaster ? "+ Fahrer" : "Kein Fahrer"}
                    </span>
                    {isMaster && v.status !== "repair" && (
                      <button
                        onClick={() => toggleStatus(v)}
                        className="text-[10px] text-zinc-700 hover:text-yellow-500 transition-colors"
                      >
                        Status
                      </button>
                    )}
                  </div>
                )}

                {nextBooking && (
                  <div className="mt-1 text-[10px] text-zinc-600 truncate">
                    ▸ <span className="text-zinc-400">{nextBooking.date}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!expanded && vehicles.length > 6 && (
        <p className="text-xs text-zinc-600 text-center mt-3">+{vehicles.length - 6} weitere → Tab "Flotte"</p>
      )}
    </div>
  );
}
