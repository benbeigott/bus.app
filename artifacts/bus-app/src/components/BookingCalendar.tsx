import { useState, useMemo, useRef } from "react";
import { type Vehicle, type Booking } from "@/lib/data";
import { calcRoute, formatDuration } from "@/lib/routeCalc";

interface Props {
  vehicles: Vehicle[];
  bookings: Booking[];
  onUpdateBookings: (b: Booking[]) => void;
  isMaster: boolean;
}

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const DOW = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const VEHICLE_COLORS = [
  { bg: "bg-yellow-500/25",  border: "border-yellow-500", solid: "bg-yellow-500",  text: "text-yellow-100" },
  { bg: "bg-blue-500/25",    border: "border-blue-500",   solid: "bg-blue-500",    text: "text-blue-100"   },
  { bg: "bg-emerald-500/25", border: "border-emerald-500",solid: "bg-emerald-500", text: "text-emerald-100"},
  { bg: "bg-purple-500/25",  border: "border-purple-500", solid: "bg-purple-500",  text: "text-purple-100" },
  { bg: "bg-pink-500/25",    border: "border-pink-500",   solid: "bg-pink-500",    text: "text-pink-100"   },
  { bg: "bg-orange-500/25",  border: "border-orange-500", solid: "bg-orange-500",  text: "text-orange-100" },
  { bg: "bg-cyan-500/25",    border: "border-cyan-500",   solid: "bg-cyan-500",    text: "text-cyan-100"   },
];

function calcDuration(startDate: string, startTime: string, endDate: string, endTime: string): string | null {
  if (!startDate || !endDate) return null;
  const start = new Date(`${startDate}T${startTime || "00:00"}`);
  const end   = new Date(`${endDate}T${endTime   || "23:59"}`);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return null;
  const days  = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days === 0 && hours === 0) return "< 1 Std.";
  if (days === 0) return `${hours} Std.`;
  if (hours === 0) return `${days} Tag${days !== 1 ? "e" : ""}`;
  return `${days} Tag${days !== 1 ? "e" : ""} ${hours} Std.`;
}

type BookingPos = "single" | "start" | "middle" | "end";

function getBookingPosition(b: Booking, dateStr: string): BookingPos | null {
  if (b.status === "cancelled") return null;
  const end = b.endDate || b.date;
  if (dateStr < b.date || dateStr > end) return null;
  if (b.date === end) return "single";
  if (dateStr === b.date) return "start";
  if (dateStr === end) return "end";
  return "middle";
}

export default function BookingCalendar({ vehicles, bookings, onUpdateBookings, isMaster }: Props) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");

  // Modal state
  const [showModal, setShowModal]           = useState(false);
  const [modalVehicleId, setModalVehicleId] = useState(vehicles[0]?.id || "");
  const [modalStartDate, setModalStartDate] = useState("");
  const [modalStartTime, setModalStartTime] = useState("");
  const [modalEndDate, setModalEndDate]     = useState("");
  const [modalEndTime, setModalEndTime]     = useState("");
  const [modalRoute, setModalRoute]         = useState("");
  const [modalCustomer, setModalCustomer]   = useState("");
  const [modalPrice, setModalPrice]         = useState("");
  const [modalTravelInfo, setModalTravelInfo] = useState("");
  const [routeLoading, setRouteLoading]     = useState(false);
  const [routeInfo, setRouteInfo]           = useState<{ distanceKm: number; durationMin: number; fromCity: string; toCity: string; fromLat: number; fromLng: number; toLat: number; toLng: number } | null>(null);
  const routeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colorMap = useMemo(() => {
    const m: Record<string, (typeof VEHICLE_COLORS)[number]> = {};
    vehicles.forEach((v, i) => { m[v.id] = VEHICLE_COLORS[i % VEHICLE_COLORS.length]; });
    return m;
  }, [vehicles]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay  = new Date(viewYear, viewMonth + 1, 0);
  let startDow   = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const rows = Math.ceil((startDow + lastDay.getDate()) / 7);

  function getDateStr(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  }

  function isToday(day: number) {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  }
  function isPast(day: number) {
    return new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  function openNewBooking(day: number) {
    if (isPast(day)) return;
    const ds = getDateStr(day);
    setModalStartDate(ds);
    setModalEndDate(ds);
    setModalStartTime("");
    setModalEndTime("");
    setModalVehicleId(selectedVehicle !== "all" ? selectedVehicle : vehicles[0]?.id || "");
    setModalRoute(""); setModalCustomer(""); setModalPrice(""); setModalTravelInfo("");
    setRouteInfo(null); setRouteLoading(false);
    setShowModal(true);
  }

  function handleRouteChange(val: string) {
    setModalRoute(val);
    setRouteInfo(null);
    if (routeTimeout.current) clearTimeout(routeTimeout.current);
    if (!val.includes("→") && !val.includes("->")) return;
    routeTimeout.current = setTimeout(async () => {
      setRouteLoading(true);
      const result = await calcRoute(val);
      setRouteLoading(false);
      setRouteInfo(result);
    }, 800);
  }

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    const endDate = modalEndDate && modalEndDate >= modalStartDate ? modalEndDate : undefined;
    let routeData = routeInfo;
    if (!routeData && modalRoute.includes("→")) {
      routeData = await calcRoute(modalRoute);
    }
    const newBooking: Booking = {
      id: `b${Date.now()}`,
      vehicleId: modalVehicleId,
      date: modalStartDate,
      endDate,
      departureTime: modalStartTime || undefined,
      returnTime: modalEndTime || undefined,
      route: modalRoute,
      customer: modalCustomer,
      price: Number(modalPrice) || 0,
      seats: 0,
      status: "pending",
      travelInfo: modalTravelInfo || undefined,
      ...(routeData ? {
        distanceKm: routeData.distanceKm,
        durationMin: routeData.durationMin,
        fromCity: routeData.fromCity,
        toCity: routeData.toCity,
        fromLat: routeData.fromLat,
        fromLng: routeData.fromLng,
        toLat: routeData.toLat,
        toLng: routeData.toLng,
      } : {}),
    };
    onUpdateBookings([...bookings, newBooking]);
    setShowModal(false);
  }

  const duration = useMemo(
    () => calcDuration(modalStartDate, modalStartTime, modalEndDate, modalEndTime),
    [modalStartDate, modalStartTime, modalEndDate, modalEndTime]
  );

  // Filter bookings for this vehicle filter (exclude cancelled)
  const visibleBookings = bookings.filter(b =>
    b.status !== "cancelled" &&
    (selectedVehicle === "all" || b.vehicleId === selectedVehicle)
  );

  // For "Kommende Fahrten" list
  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthBookings = bookings
    .filter(b => {
      if (b.status === "cancelled") return false;
      if (selectedVehicle !== "all" && b.vehicleId !== selectedVehicle) return false;
      // show if booking starts or ends in this month
      const end = b.endDate || b.date;
      return b.date.startsWith(monthStr) || end.startsWith(monthStr);
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      {/* Header */}
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
            {vehicles.map(v => <option key={v.id} value={v.id} className="bg-black">{v.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 border border-white/10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-yellow-500 hover:border-yellow-500/30 transition-all text-sm">‹</button>
            <span className="text-sm font-semibold text-white w-36 text-center">{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="w-8 h-8 border border-white/10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-yellow-500 hover:border-yellow-500/30 transition-all text-sm">›</button>
          </div>
        </div>
      </div>

      {/* Vehicle legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {vehicles.map(v => {
          const c = colorMap[v.id];
          return (
            <div key={v.id} className={`flex items-center gap-1.5 text-xs text-zinc-400 px-2.5 py-1 rounded-full border ${c.border} border-opacity-40 ${c.bg}`}>
              <span className={`w-2 h-2 rounded-full ${c.solid}`} />
              {v.name}
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="gold-border rounded-xl overflow-hidden">
        {/* Day of week header */}
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {DOW.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-zinc-500 uppercase tracking-widest bg-[#050505]">{d}</div>
          ))}
        </div>

        {/* Calendar rows */}
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="grid grid-cols-7">
            {Array.from({ length: 7 }, (_, col) => {
              const cellIndex = row * 7 + col;
              const day = cellIndex - startDow + 1;
              const isValid = day >= 1 && day <= lastDay.getDate();

              if (!isValid) {
                return <div key={col} className="cal-cell opacity-10 min-h-[90px]" />;
              }

              const dateStr   = getDateStr(day);
              const todayFlag = isToday(day);
              const pastFlag  = isPast(day);
              const isFirstCol = col === 0;
              const isLastCol  = col === 6;

              // Bookings touching this cell
              const cellBookings = visibleBookings
                .map(b => ({ b, pos: getBookingPosition(b, dateStr) }))
                .filter(x => x.pos !== null) as { b: Booking; pos: BookingPos }[];

              const hasBooking = cellBookings.length > 0;

              return (
                <div
                  key={col}
                  onClick={() => openNewBooking(day)}
                  className={`cal-cell min-h-[90px] relative overflow-hidden cursor-pointer border-r border-b border-white/[0.04]
                    ${todayFlag ? "bg-yellow-500/[0.04]" : pastFlag ? "opacity-50" : "hover:bg-white/[0.02]"}
                    ${hasBooking ? "bg-white/[0.015]" : ""}
                  `}
                >
                  {/* Day number */}
                  <div className={`text-xs font-bold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full
                    ${todayFlag ? "bg-yellow-500 text-black" : "text-zinc-500"}`}>
                    {day}
                  </div>

                  {/* Booking bars */}
                  <div className="space-y-0.5">
                    {cellBookings.map(({ b, pos }) => {
                      const c = colorMap[b.vehicleId] || VEHICLE_COLORS[0];
                      const showLabel = pos === "start" || pos === "single";
                      const showEndTime = pos === "end" && b.returnTime;

                      // Rounding: round left if start or first col of row (continuation)
                      const roundLeft  = pos === "start" || pos === "single" || isFirstCol;
                      const roundRight = pos === "end"   || pos === "single" || isLastCol;

                      return (
                        <div
                          key={b.id}
                          className={`
                            ${c.bg} ${c.text} ${c.solid}
                            text-[9px] leading-none px-1 py-1 font-medium
                            ${roundLeft  ? "rounded-l-md ml-0.5" : "-ml-0"}
                            ${roundRight ? "rounded-r-md mr-0.5" : "mr-0"}
                            ${!roundLeft && !roundRight ? "ml-0 mr-0" : ""}
                            flex items-center gap-0.5 truncate
                            ${pos === "single" ? "mx-0.5" : ""}
                            border-l-2 ${c.border}
                            ${pos === "middle" || pos === "end" ? "border-l-0" : ""}
                          `}
                          style={{ opacity: pos === "middle" ? 0.85 : 1 }}
                          title={`${b.route} — ${b.customer}${b.endDate ? ` (bis ${b.endDate})` : ""}`}
                        >
                          {showLabel && (
                            <>
                              {b.departureTime && (
                                <span className="opacity-70 flex-shrink-0">{b.departureTime}</span>
                              )}
                              <span className="truncate font-semibold">{b.route.split("→")[0]?.trim()}</span>
                            </>
                          )}
                          {pos === "middle" && (
                            <span className="opacity-50 truncate">{b.route.split("→")[0]?.trim()}</span>
                          )}
                          {showEndTime && (
                            <span className="opacity-70 truncate">↩ {b.returnTime}</span>
                          )}
                        </div>
                      );
                    })}
                    {cellBookings.length === 0 && !pastFlag && (
                      <div className="text-[9px] text-zinc-700 mt-1 opacity-0 hover:opacity-100 transition-opacity">+ Buchen</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Monthly list */}
      <div className="mt-6 gold-border rounded-xl p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Fahrten im {MONTHS[viewMonth]}</p>
        <div className="space-y-2">
          {monthBookings.map(b => {
            const v = vehicles.find(x => x.id === b.vehicleId);
            const c = colorMap[b.vehicleId] || VEHICLE_COLORS[0];
            const dur = b.endDate ? calcDuration(b.date, b.departureTime || "", b.endDate, b.returnTime || "") : null;
            return (
              <div key={b.id} className={`flex items-start gap-3 p-3 rounded-lg border-l-2 ${c.border} ${c.bg}`}>
                <div className="flex-shrink-0 w-28 text-right">
                  <div className="text-xs text-zinc-300 tabular-nums font-semibold">{b.date}</div>
                  {b.departureTime && (
                    <div className="text-[10px] text-yellow-400 tabular-nums">ab {b.departureTime}</div>
                  )}
                  {b.endDate && b.endDate !== b.date && (
                    <div className="text-[10px] text-zinc-500 tabular-nums">bis {b.endDate}</div>
                  )}
                  {b.returnTime && (
                    <div className="text-[10px] text-zinc-500 tabular-nums">↩ {b.returnTime}</div>
                  )}
                  {dur && (
                    <div className={`text-[9px] mt-0.5 px-1.5 py-0.5 rounded-full inline-block ${c.solid} text-black font-bold`}>
                      {dur}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-semibold truncate">{b.route}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{b.customer}</p>
                  {v && <p className="text-[10px] text-zinc-600 mt-0.5">{v.name}</p>}
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${b.status === "confirmed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {b.status === "confirmed" ? "Bestätigt" : "Ausstehend"}
                  </span>
                  {isMaster && b.price > 0 && (
                    <span className="text-xs text-yellow-500 font-bold tabular-nums">€ {b.price.toLocaleString("de-DE")}</span>
                  )}
                </div>
              </div>
            );
          })}
          {monthBookings.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-4">Keine Fahrten in diesem Monat</p>
          )}
        </div>
      </div>

      {/* New Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div
            className="gold-border rounded-2xl p-6 w-full max-w-lg bg-[#080808] relative overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="corner-tl" /><div className="corner-tr" />
            <div className="corner-bl" /><div className="corner-br" />

            <div className="mb-5">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Neue Buchung</p>
              <h3 className="text-lg font-bold text-white mt-0.5">Fahrt planen</h3>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Vehicle */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase tracking-widest">Fahrzeug</label>
                <select
                  value={modalVehicleId}
                  onChange={e => setModalVehicleId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 appearance-none"
                >
                  {vehicles.map(v => <option key={v.id} value={v.id} className="bg-black">{v.name} ({v.plate})</option>)}
                </select>
              </div>

              {/* Von */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Von</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-600">Datum *</label>
                    <input
                      type="date"
                      value={modalStartDate}
                      onChange={e => {
                        setModalStartDate(e.target.value);
                        if (!modalEndDate || modalEndDate < e.target.value) setModalEndDate(e.target.value);
                      }}
                      className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-600">Uhrzeit</label>
                    <input
                      type="time"
                      value={modalStartTime}
                      onChange={e => setModalStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40"
                    />
                  </div>
                </div>
              </div>

              {/* Bis */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Bis</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-600">Datum *</label>
                    <input
                      type="date"
                      value={modalEndDate}
                      min={modalStartDate || undefined}
                      onChange={e => setModalEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-600">Uhrzeit</label>
                    <input
                      type="time"
                      value={modalEndTime}
                      onChange={e => setModalEndTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40"
                    />
                  </div>
                </div>
              </div>

              {/* Duration badge */}
              {duration && (
                <div className="flex items-center gap-2 py-2 px-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <span className="text-yellow-500 text-sm">⏱</span>
                  <span className="text-xs text-yellow-400 font-semibold">Gesamtdauer: {duration}</span>
                </div>
              )}

              {/* Route */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase tracking-widest">Route *</label>
                <input
                  type="text"
                  value={modalRoute}
                  onChange={e => handleRouteChange(e.target.value)}
                  placeholder="z.B. Mainz → Paris"
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
                  required
                />
                {routeLoading && (
                  <p className="text-[10px] text-zinc-600 animate-pulse">⏳ Route wird berechnet...</p>
                )}
                {routeInfo && !routeLoading && (
                  <div className="flex items-center gap-3 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <span className="text-emerald-400 text-sm">🗺</span>
                    <div className="flex-1">
                      <span className="text-xs text-emerald-400 font-semibold">
                        {routeInfo.distanceKm} km · {formatDuration(routeInfo.durationMin)}
                      </span>
                      <p className="text-[10px] text-zinc-600">{routeInfo.fromCity} → {routeInfo.toCity}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase tracking-widest">Kunde / Unternehmen *</label>
                <input
                  type="text"
                  value={modalCustomer}
                  onChange={e => setModalCustomer(e.target.value)}
                  placeholder="Kundenname / Unternehmen"
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
                  required
                />
              </div>

              {/* Price (master only) */}
              {isMaster && (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase tracking-widest">Preis (€)</label>
                  <input
                    type="number"
                    value={modalPrice}
                    onChange={e => setModalPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
                  />
                </div>
              )}

              {/* Travel info */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase tracking-widest">Reiseinfos</label>
                <textarea
                  value={modalTravelInfo}
                  onChange={e => setModalTravelInfo(e.target.value)}
                  placeholder="Treffpunkt, Besonderheiten, Anforderungen..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-white/10 text-zinc-400 rounded-lg text-sm hover:border-white/20 transition-all">
                  Abbrechen
                </button>
                <button type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300 text-black font-bold rounded-lg text-sm hover:shadow-[0_4px_20px_rgba(201,162,39,0.25)] transition-all">
                  Buchung anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
