import { type FuelPrice } from "@/lib/data";

interface Props {
  prices: FuelPrice[];
  lastUpdate: Date;
}

export default function FuelWidget({ prices, lastUpdate }: Props) {
  const updateStr = lastUpdate.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="gold-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Tankpreise Live</p>
          <p className="text-base font-semibold text-white mt-0.5">Kraftstoff-Monitor</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 pulse-gold" />
          <span className="text-xs text-zinc-500">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {prices.map((fp, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
            <div>
              <p className="text-sm font-medium text-white">{fp.type}</p>
              <p className="text-xs text-zinc-500">{fp.unit}</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-yellow-500 tabular-nums">
                {fp.price.toFixed(3).replace(".", ",")}
              </p>
              <div className={`flex items-center justify-end gap-0.5 text-xs ${fp.change >= 0 ? "text-red-400" : "text-green-400"}`}>
                <span>{fp.change >= 0 ? "▲" : "▼"}</span>
                <span>{Math.abs(fp.change).toFixed(3).replace(".", ",")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.05]">
        <p className="text-xs text-zinc-600 text-center">
          Zuletzt aktualisiert: {updateStr} · Alle 30 Sek.
        </p>
      </div>
    </div>
  );
}
