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

  const visibleVehicles = expanded ? vehicles : vehicles.slice(0, 10);

  return (
    <div className="gold-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Fahrzeugflotte</p>
          <p className="text-sm font-semibold text-white mt-0.5">Übersicht Flotte</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-zinc-500">{vehicles.filter(v => v.status === "active").length} aktiv</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-500">{vehicles.length} gesamt</span>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {visibleVehicles.map(v => {
          const fuelBarColor = v.fuelLevel > 60 ? "bg-green-500" : v.fuelLevel > 30 ? "bg-yellow-500" : "bg-red-500";

          return (
            <div
              key={v.id}
              className="bg-zinc-950 border border-white/[0.06] rounded-lg overflow-hidden hover:border-yellow-500/20 transition-all"
            >
              {/* Image with overlay */}
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                {v.images?.[0] ? (
                  <img
                    src={v.images[0]}
                    alt={v.name}
                    className="w-full h-full object-contain bg-zinc-950"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="1" y="6" width="22" height="13" rx="2" />
                      <path d="M1 10h22" />
                      <circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
                    </svg>
                  </div>
                )}
                {/* Status dot */}
                <span className={`absolute top-1 right-1 text-[9px] px-1 py-0.5 rounded-full font-medium ${STATUS_BADGE[v.status]}`}>
                  {STATUS_LABELS[v.status]}
                </span>
              </div>

              {/* Compact info */}
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-semibold text-white truncate leading-tight">{v.name}</p>
                <p className="text-[9px] text-zinc-500 truncate">{v.plate} · {v.seats} Sitze</p>

                {/* Fuel bar */}
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${fuelBarColor}`} style={{ width: `${v.fuelLevel}%` }} />
                  </div>
                  <span className="text-[9px] text-zinc-600">{v.fuelLevel}%</span>
                </div>

                {/* Driver */}
                {editingId === v.id ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="text"
                      value={editDriver}
                      onChange={e => setEditDriver(e.target.value)}
                      placeholder="Fahrer"
                      className="text-[9px] bg-black border border-yellow-500/30 rounded px-1 py-0.5 text-white outline-none flex-1 min-w-0"
                      autoFocus
                    />
                    <button onClick={() => saveEdit(v)} className="text-[9px] text-yellow-500">✓</button>
                    <button onClick={() => setEditingId(null)} className="text-[9px] text-zinc-500">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-0.5">
                    <span
                      className={`text-[9px] truncate ${v.driver ? "text-zinc-500" : "text-zinc-700 italic"} ${isMaster ? "cursor-pointer hover:text-yellow-500" : ""}`}
                      onClick={() => isMaster && startEdit(v)}
                    >
                      {v.driver ? v.driver : isMaster ? "+ Fahrer" : "—"}
                    </span>
                    {isMaster && v.status !== "repair" && (
                      <button
                        onClick={() => toggleStatus(v)}
                        className="text-[9px] text-zinc-700 hover:text-yellow-500 transition-colors flex-shrink-0"
                      >
                        ⟳
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!expanded && vehicles.length > 10 && (
        <p className="text-xs text-zinc-600 text-center mt-3">+{vehicles.length - 10} weitere → Tab "Flotte"</p>
      )}
    </div>
  );
}
