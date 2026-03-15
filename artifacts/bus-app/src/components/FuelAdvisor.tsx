import { type FuelTip, type TankerStation } from "@/hooks/useFuelPrices";
import { type DepotLocation } from "@/lib/depots";

interface Props {
  fuelTip: FuelTip | null;
  stations: TankerStation[];
  depot: DepotLocation;
  isLive: boolean;
}

function Badge({ label, green }: { label: string; green: boolean }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
      green ? "bg-green-900/60 text-green-400" : "bg-zinc-800 text-zinc-400"
    }`}>
      {label}
    </span>
  );
}

function StationRow({ s, rank }: { s: TankerStation; rank: number }) {
  const colors = ["text-yellow-400", "text-zinc-300", "text-zinc-500"];
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base w-6 text-center flex-shrink-0">{medals[rank] ?? `${rank + 1}.`}</span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${colors[rank] ?? "text-zinc-500"}`}>
            {s.brand || s.name}
          </p>
          <p className="text-[11px] text-zinc-500 truncate">{s.street} {s.houseNumber}, {s.place}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className={`text-sm font-bold tabular-nums ${colors[rank] ?? "text-zinc-500"}`}>
          {s.diesel.toFixed(3).replace(".", ",")} €/L
        </p>
        <p className="text-[11px] text-zinc-500">{s.dist.toFixed(1)} km</p>
      </div>
    </div>
  );
}

export default function FuelAdvisor({ fuelTip, stations, depot, isLive }: Props) {
  const topStations = stations
    .filter(s => s.isOpen && s.diesel > 0)
    .sort((a, b) => a.diesel - b.diesel)
    .slice(0, 3);

  if (!isLive) {
    return (
      <div className="gold-border rounded-xl p-5 h-full flex items-center justify-center">
        <p className="text-zinc-500 text-sm text-center">Tankberater offline<br /><span className="text-xs">API wird verbunden…</span></p>
      </div>
    );
  }

  return (
    <div className="gold-border rounded-xl p-5 h-full flex flex-col gap-4">

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">KI-Tankberater</p>
          <p className="text-base font-semibold text-white mt-0.5">Beste Tankstelle</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-zinc-500">Depot</p>
          <p className="text-xs font-semibold text-yellow-500">{depot.name}</p>
        </div>
      </div>

      {fuelTip && (
        <div className={`rounded-lg p-4 border ${
          fuelTip.worthIt
            ? "bg-green-950/30 border-green-800/40"
            : "bg-zinc-900/60 border-white/[0.06]"
        }`}>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="text-base font-bold text-white leading-tight">
                {fuelTip.station.brand || fuelTip.station.name}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {fuelTip.station.street} {fuelTip.station.houseNumber}, {fuelTip.station.place}
              </p>
            </div>
            <Badge
              label={fuelTip.worthIt ? "Empfohlen ✓" : "Nicht lohnend"}
              green={fuelTip.worthIt}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-black/30 rounded-lg p-2 text-center">
              <p className="text-[11px] text-zinc-500">Diesel</p>
              <p className="text-sm font-bold text-yellow-400 tabular-nums">
                {fuelTip.station.diesel.toFixed(3).replace(".", ",")} €
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-2 text-center">
              <p className="text-[11px] text-zinc-500">Entfernung</p>
              <p className="text-sm font-bold text-white tabular-nums">
                {fuelTip.station.dist.toFixed(1)} km
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-2 text-center">
              <p className="text-[11px] text-zinc-500">Umweg</p>
              <p className={`text-sm font-bold tabular-nums ${fuelTip.extraKm > 0 ? "text-zinc-300" : "text-green-400"}`}>
                {fuelTip.extraKm > 0 ? `+${fuelTip.extraKm} km` : "Nächste"}
              </p>
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-3 space-y-1.5 text-[12px]">
            <div className="flex justify-between text-zinc-400">
              <span>Ersparnis vs. nächste Station (400 L)</span>
              <span className="font-semibold text-green-400">
                +{fuelTip.refuelCostSavings.toFixed(2).replace(".", ",")} €
              </span>
            </div>
            {fuelTip.extraKm > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Umwegkosten ({(fuelTip.extraKm * 2).toFixed(1)} km Hin+Zurück)</span>
                <span className="font-semibold text-red-400">
                  −{fuelTip.extraDrivingCost.toFixed(2).replace(".", ",")} €
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/[0.06] pt-1.5">
              <span className="font-semibold text-white">Nettoersparnis</span>
              <span className={`font-bold ${fuelTip.netSavingsEur > 0 ? "text-green-400" : "text-red-400"}`}>
                {fuelTip.netSavingsEur > 0 ? "+" : ""}{fuelTip.netSavingsEur.toFixed(2).replace(".", ",")} €
              </span>
            </div>
            {fuelTip.extraMinutes > 0 && (
              <p className="text-zinc-600 text-center pt-0.5">
                {fuelTip.extraMinutes} Min. länger · {(fuelTip.savingsPerLiter * 100).toFixed(1)} ct/L günstiger
              </p>
            )}
          </div>

          <p className={`mt-2 text-[11px] font-medium text-center ${fuelTip.worthIt ? "text-green-400" : "text-zinc-500"}`}>
            {fuelTip.worthIt
              ? `✓ Umweg lohnt sich — ${fuelTip.netSavingsEur.toFixed(2).replace(".", ",")} € Nettoersparnis pro Volltankung`
              : `✗ Nächste Station tanken — Umweg kostet mehr als er spart`}
          </p>
        </div>
      )}

      {topStations.length > 0 && (
        <div>
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-2">Günstigste Diesel-Stationen</p>
          <div>
            {topStations.map((s, i) => (
              <StationRow key={s.id} s={s} rank={i} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
