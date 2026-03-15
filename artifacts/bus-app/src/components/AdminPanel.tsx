import { useState } from "react";
import { type Vehicle, type Driver } from "@/lib/data";
import { type Partner } from "@/App";

interface Props {
  vehicles: Vehicle[];
  partners: Partner[];
  drivers: Driver[];
  onAddVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onAddPartner: (p: Partner) => void;
  onDeletePartner: (id: string) => void;
  onUpdatePartner: (p: Partner) => void;
  onAddDriver: (d: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

const VEHICLE_TYPES: Vehicle["type"][] = ["Reisebus", "Stadtbus", "Minibus", "Doppeldecker"];
const VEHICLE_STATUSES: Vehicle["status"][] = ["active", "standby", "repair"];

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  standby: "Standby",
  repair: "Werkstatt",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400",
  standby: "text-yellow-500",
  repair: "text-red-400",
};

const emptyVehicle = {
  name: "",
  plate: "",
  seats: 50,
  type: "Reisebus" as Vehicle["type"],
  status: "active" as Vehicle["status"],
  driver: "",
  lastService: new Date().toISOString().split("T")[0],
  fuelLevel: 80,
  mileage: 0,
};

type Section = "partners" | "vehicles" | "drivers";

export default function AdminPanel({
  vehicles, partners, drivers,
  onAddVehicle, onDeleteVehicle,
  onAddPartner, onDeletePartner, onUpdatePartner,
  onAddDriver, onDeleteDriver,
}: Props) {
  const [activeSection, setActiveSection] = useState<Section>("partners");

  const [newVehicle, setNewVehicle] = useState(emptyVehicle);
  const [vehicleAdded, setVehicleAdded] = useState(false);
  const [confirmDeleteVehicle, setConfirmDeleteVehicle] = useState<string | null>(null);

  const [newPartner, setNewPartner] = useState({ id: "", code: "", name: "" });
  const [partnerAdded, setPartnerAdded] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [confirmDeletePartner, setConfirmDeletePartner] = useState<string | null>(null);

  const [newDriver, setNewDriver] = useState({ name: "", phone: "" });
  const [driverAdded, setDriverAdded] = useState(false);
  const [confirmDeleteDriver, setConfirmDeleteDriver] = useState<string | null>(null);

  function handleAddVehicle() {
    if (!newVehicle.name || !newVehicle.plate) return;
    const id = "v" + Date.now();
    onAddVehicle({ ...newVehicle, id, driver: newVehicle.driver || undefined });
    setNewVehicle(emptyVehicle);
    setVehicleAdded(true);
    setTimeout(() => setVehicleAdded(false), 3000);
  }

  function handleAddPartner() {
    if (!newPartner.id || !newPartner.code || !newPartner.name) return;
    onAddPartner({ ...newPartner, role: "partner" });
    setNewPartner({ id: "", code: "", name: "" });
    setPartnerAdded(true);
    setTimeout(() => setPartnerAdded(false), 3000);
  }

  function handleAddDriver() {
    if (!newDriver.name || !newDriver.phone) return;
    onAddDriver({ id: "d" + Date.now(), ...newDriver });
    setNewDriver({ name: "", phone: "" });
    setDriverAdded(true);
    setTimeout(() => setDriverAdded(false), 3000);
  }

  const sections = [
    { id: "partners" as const, label: "Partner-Konten" },
    { id: "vehicles" as const, label: "Flotte verwalten" },
    { id: "drivers" as const, label: "Fahrer" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-8 bg-yellow-500 rounded-full" />
        <h2 className="text-lg font-bold text-white tracking-wide">Verwaltung</h2>
        <span className="text-xs text-yellow-500/60 border border-yellow-500/20 px-2 py-0.5 rounded">Master only</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSection === s.id
                ? "bg-yellow-500 text-black"
                : "border border-white/10 text-zinc-400 hover:border-yellow-500/30 hover:text-yellow-500"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* PARTNER ACCOUNTS */}
      {activeSection === "partners" && (
        <div className="space-y-5">
          <div className="border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Bestehende Partner ({partners.length})</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Partner-ID", "Name", "Passwort", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-zinc-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-sm font-mono text-yellow-500">{p.id}</td>
                    <td className="px-5 py-3 text-sm text-white">{p.name}</td>
                    <td className="px-5 py-3 text-sm text-zinc-500 font-mono">
                      {editingPartner?.id === p.id ? (
                        <input
                          className="bg-white/5 border border-yellow-500/30 rounded px-2 py-1 text-white text-xs w-32 focus:outline-none focus:border-yellow-500"
                          value={editingPartner.code}
                          onChange={e => setEditingPartner({ ...editingPartner, code: e.target.value })}
                        />
                      ) : (
                        <span className="tracking-widest">••••••••</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        {editingPartner?.id === p.id ? (
                          <>
                            <button onClick={() => { onUpdatePartner(editingPartner); setEditingPartner(null); }}
                              className="text-xs text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded hover:bg-yellow-500/10 transition-all">Speichern</button>
                            <button onClick={() => setEditingPartner(null)} className="text-xs text-zinc-500 hover:text-white px-2">Abbrechen</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingPartner(p)}
                              className="text-xs text-zinc-400 border border-white/10 px-3 py-1 rounded hover:border-yellow-500/30 hover:text-yellow-500 transition-all">Passwort</button>
                            {confirmDeletePartner === p.id ? (
                              <button onClick={() => { onDeletePartner(p.id); setConfirmDeletePartner(null); }}
                                className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10 transition-all">Bestätigen</button>
                            ) : (
                              <button onClick={() => setConfirmDeletePartner(p.id)}
                                className="text-xs text-zinc-600 hover:text-red-400 px-2 transition-all">✕</button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-yellow-500/20 rounded-xl p-5 bg-yellow-500/[0.03] space-y-4">
            <span className="text-xs font-semibold text-yellow-500/80 uppercase tracking-widest">Neuen Partner anlegen</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Partner-ID</label>
                <input
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 placeholder-zinc-700"
                  placeholder="z.B. BER04"
                  value={newPartner.id}
                  onChange={e => setNewPartner({ ...newPartner, id: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Firmenname</label>
                <input
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 placeholder-zinc-700"
                  placeholder="z.B. Berlin Reisen GmbH"
                  value={newPartner.name}
                  onChange={e => setNewPartner({ ...newPartner, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Passwort</label>
                <input
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 placeholder-zinc-700"
                  placeholder="Sicheres Passwort"
                  value={newPartner.code}
                  onChange={e => setNewPartner({ ...newPartner, code: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddPartner}
                disabled={!newPartner.id || !newPartner.code || !newPartner.name}
                className="px-5 py-2 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                + Partner anlegen
              </button>
              {partnerAdded && <span className="text-xs text-green-400">✓ Partner angelegt</span>}
            </div>
          </div>
        </div>
      )}

      {/* FLEET MANAGEMENT */}
      {activeSection === "vehicles" && (
        <div className="space-y-5">
          <div className="border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Aktuelle Flotte ({vehicles.length} Fahrzeuge)</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Fahrzeug", "Kennzeichen", "Typ", "Sitze", "Status", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-zinc-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm text-white font-medium">{v.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-yellow-500">{v.plate}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{v.type}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{v.seats}</td>
                    <td className={`px-4 py-3 text-xs font-medium ${STATUS_COLORS[v.status] || "text-zinc-500"}`}>{STATUS_LABELS[v.status] || v.status}</td>
                    <td className="px-4 py-3 text-right">
                      {confirmDeleteVehicle === v.id ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { onDeleteVehicle(v.id); setConfirmDeleteVehicle(null); }}
                            className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10 transition-all">Löschen</button>
                          <button onClick={() => setConfirmDeleteVehicle(null)} className="text-xs text-zinc-500 hover:text-white px-2">Abbrechen</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteVehicle(v.id)}
                          className="text-xs text-zinc-600 hover:text-red-400 transition-all px-2">✕ Entfernen</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-yellow-500/20 rounded-xl p-5 bg-yellow-500/[0.03] space-y-4">
            <span className="text-xs font-semibold text-yellow-500/80 uppercase tracking-widest">Neues Fahrzeug hinzufügen</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Fahrzeugname *</label>
                <input
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 placeholder-zinc-700"
                  placeholder="z.B. Mercedes Tourismo"
                  value={newVehicle.name}
                  onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Kennzeichen *</label>
                <input
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 placeholder-zinc-700"
                  placeholder="z.B. MZ-BUS-108"
                  value={newVehicle.plate}
                  onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Fahrzeugtyp</label>
                <select
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                  value={newVehicle.type}
                  onChange={e => setNewVehicle({ ...newVehicle, type: e.target.value as Vehicle["type"] })}
                >
                  {VEHICLE_TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Status</label>
                <select
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                  value={newVehicle.status}
                  onChange={e => setNewVehicle({ ...newVehicle, status: e.target.value as Vehicle["status"] })}
                >
                  {VEHICLE_STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900">{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Sitzplätze</label>
                <input type="number"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                  value={newVehicle.seats} min={1} max={120}
                  onChange={e => setNewVehicle({ ...newVehicle, seats: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Fahrer (optional)</label>
                <input
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 placeholder-zinc-700"
                  placeholder="Name des Fahrers"
                  value={newVehicle.driver}
                  onChange={e => setNewVehicle({ ...newVehicle, driver: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Letzter Service</label>
                <input type="date"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                  value={newVehicle.lastService}
                  onChange={e => setNewVehicle({ ...newVehicle, lastService: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleAddVehicle}
                disabled={!newVehicle.name || !newVehicle.plate}
                className="px-6 py-2.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                + Bus zur Flotte hinzufügen
              </button>
              {vehicleAdded && <span className="text-xs text-green-400">✓ Fahrzeug hinzugefügt</span>}
            </div>
          </div>
        </div>
      )}

      {/* DRIVER MANAGEMENT */}
      {activeSection === "drivers" && (
        <div className="space-y-5">
          <div className="border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Fahrerliste ({drivers.length})</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Name", "Mobilnummer", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-zinc-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-6 text-xs text-zinc-600 text-center">Noch keine Fahrer eingetragen</td></tr>
                )}
                {drivers.map(d => (
                  <tr key={d.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-sm text-white font-medium">{d.name}</td>
                    <td className="px-5 py-3 text-sm text-zinc-400 font-mono">{d.phone}</td>
                    <td className="px-5 py-3 text-right">
                      {confirmDeleteDriver === d.id ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { onDeleteDriver(d.id); setConfirmDeleteDriver(null); }}
                            className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10 transition-all">Löschen</button>
                          <button onClick={() => setConfirmDeleteDriver(null)} className="text-xs text-zinc-500 hover:text-white px-2">Abbrechen</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteDriver(d.id)}
                          className="text-xs text-zinc-600 hover:text-red-400 transition-all px-2">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-yellow-500/20 rounded-xl p-5 bg-yellow-500/[0.03] space-y-4">
            <span className="text-xs font-semibold text-yellow-500/80 uppercase tracking-widest">Neuen Fahrer hinzufügen</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Fahrername *</label>
                <input
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 placeholder-zinc-700"
                  placeholder="Vor- und Nachname"
                  value={newDriver.name}
                  onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Mobilnummer *</label>
                <input
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 placeholder-zinc-700"
                  placeholder="+49 151 12345678"
                  value={newDriver.phone}
                  onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddDriver}
                disabled={!newDriver.name || !newDriver.phone}
                className="px-5 py-2 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                + Fahrer hinzufügen
              </button>
              {driverAdded && <span className="text-xs text-green-400">✓ Fahrer hinzugefügt</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
