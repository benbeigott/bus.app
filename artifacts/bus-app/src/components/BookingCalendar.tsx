import { useState } from "react";
import { type Vehicle, type Booking } from "@/lib/data";

interface Props {
  vehicles: Vehicle[];
  bookings: Booking[];
  onUpdateBookings: (b: Booking[]) => void;
  isMaster: boolean;
}

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const DOW = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function BookingCalendar({ vehicles, bookings, onUpdateBookings, isMaster }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [modalVehicleId, setModalVehicleId] = useState(vehicles[0]?.id || "");
  const [modalRoute, setModalRoute] = useState("");
  const [modalCustomer, setModalCustomer] = useState("");
  const [modalPrice, setModalPrice] = useState("");
  const [modalDepartureTime, setModalDepartureTime] = useState("");
  const [modalReturnTime, setModalReturnTime] = useState("");
  const [modalTravelInfo, setModalTravelInfo] = useState("");

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const totalCells = startDow + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);

  function getDateStr(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  }

  function getBookingsForDay(day: number) {
    const dateStr = getDateStr(day);
    return bookings.filter(b =>
      b.date === dateStr &&
      b.status !== "cancelled" &&
      (selectedVehicle === "all" || b.vehicleId === selectedVehicle)
    );
  }

  function isToday(day: number) {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  }

  function isPast(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  }

  function openNewBooking(day: number) {
    if (!isMaster || isPast(day)) return;
    setModalDate(getDateStr(day));
    setModalVehicleId(selectedVehicle !== "all" ? selectedVehicle : vehicles[0]?.id || "");
    setModalRoute("");
    setModalCustomer("");
    setModalPrice("");
    setModalDepartureTime("");
    setModalReturnTime("");
    setModalTravelInfo("");
    setShowModal(true);
  }

  function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newBooking: Booking = {
      id: `b${Date.now()}`,
      vehicleId: modalVehicleId,
      date: modalDate,
      departureTime: modalDepartureTime || undefined,
      returnTime: modalReturnTime || undefined,
      route: modalRoute,
      customer: modalCustomer,
      price: Number(modalPrice) || 0,
      seats: 0,
      status: "pending",
      travelInfo: modalTravelInfo || undefined,
    };
    onUpdateBookings([...bookings, newBooking]);
    setShowModal(false);
  }

  const vehicleColors: Record<string, string> = {};
  const colors = ["border-yellow-500", "border-blue-500", "border-green-500", "border-purple-500", "border-pink-500", "border-orange-500", "border-cyan-500"];
  vehicles.forEach((v, i) => { vehicleColors[v.id] = colors[i % colors.length]; });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Planung & Ausbuchung</p>
          <p className="text-xl font-bold text-white mt-0.5">Buchungskalender</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedVehicle}
            onChange={e => setSelectedVehicle(e.target.value)}
            className="text-xs bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500/40 appearance-none pr-6"
          >
            <option value="all">Alle Fahrzeuge</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id} className="bg-black">{v.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 border border-white/10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-yellow-500 hover:border-yellow-500/30 transition-all text-sm">‹</button>
            <span className="text-sm font-semibold text-white w-36 text-center">{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="w-8 h-8 border border-white/10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-yellow-500 hover:border-yellow-500/30 transition-all text-sm">›</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {vehicles.map(v => (
          <div key={v.id} className={`flex items-center gap-1.5 text-xs text-zinc-500 px-2.5 py-1 rounded-full border ${vehicleColors[v.id]} border-opacity-40 bg-white/[0.02]`}>
            <span className={`w-1.5 h-1.5 rounded-full ${vehicleColors[v.id].replace("border-", "bg-")}`} />
            {v.name}
          </div>
        ))}
      </div>

      <div className="gold-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {DOW.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-zinc-500 uppercase tracking-widest bg-[#050505]">
              {d}
            </div>
          ))}
        </div>

        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="grid grid-cols-7">
            {Array.from({ length: 7 }, (_, col) => {
              const cellIndex = row * 7 + col;
              const day = cellIndex - startDow + 1;
              const isValid = day >= 1 && day <= lastDay.getDate();

              if (!isValid) {
                return <div key={col} className="cal-cell opacity-10 min-h-[80px]" />;
              }

              const dayBookings = getBookingsForDay(day);
              const todayFlag = isToday(day);
              const pastFlag = isPast(day);

              return (
                <div
                  key={col}
                  onClick={() => openNewBooking(day)}
                  className={`cal-cell ${todayFlag ? "today" : ""} ${pastFlag ? "past" : ""} ${dayBookings.length > 0 ? "booked" : ""}`}
                >
                  <div className={`text-xs font-semibold mb-1 ${todayFlag ? "text-yellow-500" : "text-zinc-400"}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map(b => (
                      <div
                        key={b.id}
                        className={`text-[10px] leading-none px-1 py-0.5 rounded truncate border-l-2 ${vehicleColors[b.vehicleId]} bg-white/[0.03] text-zinc-300`}
                      >
                        {b.departureTime && <span className="text-zinc-500 mr-1">{b.departureTime}</span>}
                        {b.route}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-zinc-600">+{dayBookings.length - 3} mehr</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-6 gold-border rounded-xl p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Kommende Fahrten im {MONTHS[viewMonth]}</p>
        <div className="space-y-2">
          {bookings
            .filter(b =>
              b.date.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`) &&
              b.status !== "cancelled" &&
              (selectedVehicle === "all" || b.vehicleId === selectedVehicle)
            )
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(b => {
              const v = vehicles.find(x => x.id === b.vehicleId);
              return (
                <div key={b.id} className={`flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border-l-2 ${vehicleColors[b.vehicleId]}`}>
                  <div className="flex-shrink-0 text-right w-24">
                    <div className="text-xs text-zinc-500 tabular-nums">{b.date}</div>
                    {b.departureTime && <div className="text-[10px] text-yellow-500/70 tabular-nums">⏱ {b.departureTime}{b.returnTime ? ` – ${b.returnTime}` : ""}</div>}
                  </div>
                  <span className="text-xs text-zinc-300 flex-1 font-medium">{b.route}</span>
                  <span className="text-xs text-zinc-500 hidden md:inline">{v?.name}</span>
                  <span className="text-xs text-zinc-500 hidden sm:inline">{b.customer}</span>
                  <span className="text-xs text-yellow-500 font-semibold tabular-nums flex-shrink-0">
                    € {b.price.toLocaleString("de-DE")}
                  </span>
                </div>
              );
            })}
          {bookings.filter(b =>
            b.date.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`) &&
            b.status !== "cancelled" &&
            (selectedVehicle === "all" || b.vehicleId === selectedVehicle)
          ).length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-4">Keine Fahrten in diesem Monat</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="gold-border rounded-2xl p-6 w-full max-w-md bg-[#0a0a0a] relative overflow-y-auto max-h-[90vh]">
            <div className="corner-tl" /><div className="corner-tr" />
            <div className="corner-bl" /><div className="corner-br" />
            <h3 className="text-lg font-semibold text-white mb-1">Neue Buchung</h3>
            <p className="text-xs text-zinc-500 mb-5">{modalDate}</p>
            <form onSubmit={handleModalSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Fahrzeug</label>
                <select
                  value={modalVehicleId}
                  onChange={e => setModalVehicleId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 appearance-none"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id} className="bg-black">{v.name} ({v.plate})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Abfahrtszeit</label>
                  <input
                    type="time"
                    value={modalDepartureTime}
                    onChange={e => setModalDepartureTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Rückkunft / Ankunft</label>
                  <input
                    type="time"
                    value={modalReturnTime}
                    onChange={e => setModalReturnTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Route *</label>
                <input
                  type="text"
                  value={modalRoute}
                  onChange={e => setModalRoute(e.target.value)}
                  placeholder="z.B. Mainz → Paris"
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Kunde / Unternehmen *</label>
                <input
                  type="text"
                  value={modalCustomer}
                  onChange={e => setModalCustomer(e.target.value)}
                  placeholder="Kundenname / Unternehmen"
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Preis (€)</label>
                <input
                  type="number"
                  value={modalPrice}
                  onChange={e => setModalPrice(e.target.value)}
                  placeholder="2500"
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Reiseinformationen</label>
                <textarea
                  value={modalTravelInfo}
                  onChange={e => setModalTravelInfo(e.target.value)}
                  placeholder="Besonderheiten, Treffpunkt, Anforderungen..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-white/10 text-zinc-400 rounded-lg text-sm hover:border-white/20">Abbrechen</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300 text-black font-semibold rounded-lg text-sm">Buchen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
