import { useState } from "react";
import { type Booking, type Vehicle } from "@/lib/data";

interface Props {
  bookings: Booking[];
  vehicles: Vehicle[];
  isMaster: boolean;
  onUpdate: (bookings: Booking[]) => void;
  limit?: number;
  title?: string;
  currentPartnerId?: string;
}

const STATUS_LABELS: Record<Booking["status"], string> = {
  confirmed: "Bestätigt",
  pending: "Ausstehend",
  cancelled: "Storniert",
};

const STATUS_BADGE: Record<Booking["status"], string> = {
  confirmed: "badge-active",
  pending: "badge-standby",
  cancelled: "badge-repair",
};

interface BookingForm {
  vehicleId: string;
  date: string;
  endDate: string;
  departureTime: string;
  returnTime: string;
  route: string;
  customer: string;
  price: number | "";
  seats: number | "";
  notes: string;
}

export default function BookingTable({ bookings, vehicles, isMaster, onUpdate, limit, title, currentPartnerId }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<"all" | Booking["status"]>("all");
  const [form, setForm] = useState<BookingForm>({
    vehicleId: vehicles[0]?.id || "",
    date: "",
    endDate: "",
    departureTime: "",
    returnTime: "",
    route: "",
    customer: "",
    price: "",
    seats: "",
    notes: "",
  });

  const filtered = (filter === "all" ? bookings : bookings.filter(b => b.status === filter))
    .sort((a, b) => a.date.localeCompare(b.date));
  const displayed = limit ? filtered.slice(0, limit) : filtered;

  const emptyForm: BookingForm = {
    vehicleId: vehicles[0]?.id || "",
    date: "", endDate: "", departureTime: "", returnTime: "",
    route: "", customer: "", price: "", seats: "", notes: "",
  };

  function openNew() {
    setEditBooking(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(b: Booking) {
    setEditBooking(b);
    setForm({
      vehicleId: b.vehicleId,
      date: b.date,
      endDate: b.endDate || "",
      departureTime: b.departureTime || "",
      returnTime: b.returnTime || "",
      route: b.route,
      customer: b.customer,
      price: b.price,
      seats: b.seats,
      notes: b.travelInfo || "",
    });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fields = {
      vehicleId: form.vehicleId,
      date: form.date,
      endDate: form.endDate || undefined,
      departureTime: form.departureTime || undefined,
      returnTime: form.returnTime || undefined,
      route: form.route,
      customer: form.customer,
      price: Number(form.price),
      seats: Number(form.seats),
      travelInfo: form.notes || undefined,
    };
    if (editBooking) {
      onUpdate(bookings.map(b => b.id === editBooking.id ? { ...b, ...fields } : b));
    } else {
      onUpdate([...bookings, { id: `b${Date.now()}`, status: "pending" as const, ...fields }]);
    }
    setShowModal(false);
  }

  function handleStatusChange(id: string, status: Booking["status"]) {
    onUpdate(bookings.map(b => b.id === id ? { ...b, status } : b));
  }

  function handleDelete(id: string) {
    if (confirm("Buchung wirklich stornieren?")) {
      onUpdate(bookings.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
    }
  }

  function getVehicleName(id: string) {
    return vehicles.find(v => v.id === id)?.name || id;
  }

  return (
    <div className="gold-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Buchungsübersicht</p>
          <p className="text-base font-semibold text-white mt-0.5">{title || "Ausbuchungen"}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {(["all", "confirmed", "pending", "cancelled"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  filter === f
                    ? "bg-yellow-500/15 text-yellow-500 border border-yellow-500/25"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                {f === "all" ? "Alle" : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
          {isMaster && (
            <button
              onClick={openNew}
              className="text-xs bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300 text-black font-semibold px-4 py-1.5 rounded-lg hover:shadow-[0_4px_20px_rgba(201,162,39,0.25)] transition-all"
            >
              + Neue Buchung
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-600 uppercase tracking-widest border-b border-white/[0.05]">
              <th className="text-left pb-3 font-medium">Datum</th>
              <th className="text-left pb-3 font-medium">Fahrzeug</th>
              <th className="text-left pb-3 font-medium">Route</th>
              <th className="text-left pb-3 font-medium hidden md:table-cell">Kunde</th>
              {!isMaster && currentPartnerId && <th className="text-right pb-3 font-medium hidden sm:table-cell">Preis</th>}
              <th className="text-center pb-3 font-medium">Status</th>
              {isMaster && <th className="text-right pb-3 font-medium">Aktionen</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {displayed.map(b => (
              <tr key={b.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="py-3 pr-4">
                  <span className="text-zinc-300 tabular-nums text-xs">{b.date}</span>
                  {b.endDate && (
                    <p className="text-[10px] text-zinc-600 mt-0.5 tabular-nums">bis {b.endDate}</p>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span className="text-zinc-400 text-xs">{getVehicleName(b.vehicleId)}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-white font-medium text-xs">{b.route}</span>
                  {b.notes && <p className="text-xs text-zinc-600 mt-0.5">{b.notes}</p>}
                </td>
                <td className="py-3 pr-4 hidden md:table-cell">
                  <span className="text-zinc-400 text-xs">{b.customer}</span>
                </td>
                {!isMaster && currentPartnerId && (
                  <td className="py-3 pr-4 text-right hidden sm:table-cell">
                    {b.createdBy === currentPartnerId && b.price > 0 ? (
                      <span className="text-yellow-500 font-semibold tabular-nums text-xs">
                        € {b.price.toLocaleString("de-DE")}
                      </span>
                    ) : (
                      <span className="text-zinc-700 text-xs">—</span>
                    )}
                  </td>
                )}
                <td className="py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[b.status]}`}>
                    {STATUS_LABELS[b.status]}
                  </span>
                </td>
                {isMaster && (
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(b)}
                        className="text-xs text-yellow-500 hover:text-yellow-400"
                      >
                        Bearbeiten
                      </button>
                      {b.status === "pending" && (
                        <button
                          onClick={() => handleStatusChange(b.id, "confirmed")}
                          className="text-xs text-green-400 hover:text-green-300"
                        >
                          Bestätigen
                        </button>
                      )}
                      {b.status !== "cancelled" && (
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Stornieren
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-600 text-sm">
                  Keine Buchungen gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {limit && filtered.length > limit && (
        <p className="text-xs text-zinc-600 text-center mt-3">
          Zeige {limit} von {filtered.length} Buchungen → Tab "Ausbuchungen"
        </p>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="gold-border rounded-2xl p-8 w-full max-w-lg relative bg-[#0a0a0a] max-h-[90vh] overflow-y-auto">
            <div className="corner-tl" /><div className="corner-tr" />
            <div className="corner-bl" /><div className="corner-br" />
            <h3 className="text-lg font-semibold text-white mb-6">
              {editBooking ? "Buchung bearbeiten" : "Neue Buchung"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Fahrzeug</label>
                <select
                  value={form.vehicleId}
                  onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 appearance-none"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id} className="bg-black">{v.name} ({v.plate})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Startdatum *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">
                    Enddatum
                    <span className="ml-1 text-zinc-700 normal-case">(mehrtägig)</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.date || undefined}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Abfahrt</label>
                  <input
                    type="time"
                    value={form.departureTime}
                    onChange={e => setForm(f => ({ ...f, departureTime: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Rückkehr</label>
                  <input
                    type="time"
                    value={form.returnTime}
                    onChange={e => setForm(f => ({ ...f, returnTime: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Route</label>
                <input
                  type="text"
                  value={form.route}
                  onChange={e => setForm(f => ({ ...f, route: e.target.value }))}
                  placeholder="z.B. Mainz → Paris"
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Kunde</label>
                <input
                  type="text"
                  value={form.customer}
                  onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                  placeholder="Kundenname / Unternehmen"
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Preis (€)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value ? Number(e.target.value) : "" }))}
                    placeholder="2500"
                    className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Sitze</label>
                  <input
                    type="number"
                    value={form.seats}
                    onChange={e => setForm(f => ({ ...f, seats: e.target.value ? Number(e.target.value) : "" }))}
                    placeholder="50"
                    className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Notizen</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Besondere Anforderungen..."
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-white/10 text-zinc-400 rounded-lg text-sm hover:border-white/20 transition-all"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300 text-black font-semibold rounded-lg text-sm hover:shadow-[0_4px_20px_rgba(201,162,39,0.25)] transition-all"
                >
                  {editBooking ? "Speichern" : "Buchen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
