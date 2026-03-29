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

  const visibleVehicles = expanded ? vehicles : vehicles.slice(0, 5);

  return (
    <div className="gold-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
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

      <div className="space-y-3">
        {visibleVehicles.map(v => {
          const todayBookings = bookings.filter(b => b.vehicleId === v.id && b.status !== "cancelled");
          const nextBooking = todayBookings.sort((a, b) => a.date.localeCompare(b.date))[0];
          const fuelBarColor = v.fuelLevel > 60 ? "bg-green-500" : v.fuelLevel > 30 ? "bg-yellow-500" : "bg-red-500";

          return (
            <div key={v.id} className="bg-white/[0.02] border border-white/[0.04] rounded-lg hover:border-yellow-500/15 transition-all overflow-hidden">
              {/* Bus photo — full-width banner if available */}
              {v.images?.[0] && (
                <div className="w-full bg-zinc-950 overflow-hidden relative" style={{ aspectRatio: "16/7" }}>
                  <img
                    src={v.images[0]}
                    alt={v.name}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <span className="text-sm font-bold text-white drop-shadow">{v.name}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[v.status]}`}>
                      {STATUS_LABELS[v.status]}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!v.images?.[0] && <span className="text-sm font-semibold text-white truncate">{v.name}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[v.status]}`}>
                      {STATUS_LABELS[v.status]}
                    </span>
                    <span className="text-xs text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded">{v.plate}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-4 flex-wrap">
                    <span className="text-xs text-zinc-500">{v.type} · {v.seats} Sitze</span>
                    {editingId === v.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editDriver}
                          onChange={e => setEditDriver(e.target.value)}
                          placeholder="Fahrername"
                          className="text-xs bg-black border border-yellow-500/30 rounded px-2 py-0.5 text-white outline-none w-36"
                          autoFocus
                        />
                        <button onClick={() => saveEdit(v)} className="text-xs text-yellow-500 hover:text-yellow-400">✓</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-zinc-500 hover:text-zinc-400">✕</button>
                      </div>
                    ) : (
                      <span
                        className={`text-xs ${v.driver ? "text-zinc-400" : "text-zinc-600 italic"} ${isMaster ? "cursor-pointer hover:text-yellow-500" : ""}`}
                        onClick={() => isMaster && startEdit(v)}
                        title={isMaster ? "Fahrer bearbeiten" : undefined}
                      >
                        {v.driver ? `👤 ${v.driver}` : isMaster ? "+ Fahrer zuweisen" : "Kein Fahrer"}
                      </span>
                    )}
                  </div>

                  {/* Fuel level */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-zinc-600 w-10">Tank</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${fuelBarColor}`} style={{ width: `${v.fuelLevel}%` }} />
                    </div>
                    <span className="text-xs text-zinc-500 w-8 text-right">{v.fuelLevel}%</span>
                  </div>

                  {nextBooking && (
                    <div className="mt-2 text-xs text-zinc-500">
                      Nächste Fahrt: <span className="text-zinc-300">{nextBooking.date}</span> — <span className="text-zinc-300">{nextBooking.route}</span>
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-zinc-600">{(v.mileage / 1000).toFixed(0)}k km</p>
                  {isMaster && v.status !== "repair" && (
                    <button
                      onClick={() => toggleStatus(v)}
                      className="mt-1 text-xs text-zinc-600 hover:text-yellow-500 transition-colors"
                    >
                      Status ändern
                    </button>
                  )}
                </div>
              </div>
              </div>
            </div>
          );
        })}
      </div>

      {!expanded && vehicles.length > 5 && (
        <p className="text-xs text-zinc-600 text-center mt-3">+{vehicles.length - 5} weitere → Tab "Flotte"</p>
      )}
    </div>
  );
}
