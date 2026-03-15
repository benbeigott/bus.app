import { type FuelPrice } from "@/lib/data";

function SkullPumpIcon() {
  return (
    <svg width="36" height="44" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pump body */}
      <rect x="2" y="22" width="22" height="22" rx="3" fill="#C9A227" />
      {/* Pump screen */}
      <rect x="5.5" y="25.5" width="15" height="9" rx="1.5" fill="#000" opacity="0.55" />
      <rect x="8" y="28" width="10" height="1.5" rx="0.75" fill="#C9A227" opacity="0.5" />
      <rect x="8" y="31" width="6" height="1.5" rx="0.75" fill="#C9A227" opacity="0.35" />
      {/* Pump base */}
      <rect x="2" y="38" width="22" height="6" rx="0" fill="#A07B15" />
      <rect x="2" y="41" width="22" height="3" rx="0" fill="#8A6912" />
      {/* Nozzle arm */}
      <rect x="24" y="24" width="4" height="12" rx="2" fill="#C9A227" />
      <path d="M26 36 Q32 36 32 42 L32 46" stroke="#C9A227" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="28" y="43" width="7" height="3" rx="1.5" fill="#C9A227" />
      {/* Skull cranium */}
      <ellipse cx="13" cy="13" rx="11" ry="10" fill="#C9A227" />
      {/* Eye sockets */}
      <ellipse cx="8.5"  cy="13" rx="3.2" ry="3.2" fill="#1a1000" />
      <ellipse cx="17.5" cy="13" rx="3.2" ry="3.2" fill="#1a1000" />
      {/* $ eyes */}
      <text x="6.2"  y="15.8" fontSize="5" fill="#C9A227" fontWeight="900" fontFamily="Arial, sans-serif">$</text>
      <text x="15.2" y="15.8" fontSize="5" fill="#C9A227" fontWeight="900" fontFamily="Arial, sans-serif">$</text>
      {/* Jaw */}
      <rect x="4" y="20" width="18" height="5" rx="2" fill="#C9A227" />
      {/* Teeth */}
      <rect x="6"    y="21" width="3" height="4" rx="1" fill="#1a1000" />
      <rect x="10.5" y="21" width="3" height="4" rx="1" fill="#1a1000" />
      <rect x="15"   y="21" width="3" height="4" rx="1" fill="#1a1000" />
      {/* Smile */}
      <path d="M5 20 Q13 24.5 21 20" stroke="#1a1000" strokeWidth="1.2" fill="none" />
      {/* Nose */}
      <path d="M11 17 L13 19.5 L15 17" stroke="#1a1000" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  prices: FuelPrice[];
  isLive: boolean;
}

export default function FuelPriceTicker({ prices, isLive }: Props) {
  const diesel = prices.find(p => p.type === "Diesel");
  const e5     = prices.find(p => p.type === "Super E5");

  if (!diesel && !e5) return null;

  return (
    <div className="flex items-center gap-2 border border-yellow-500/15 bg-yellow-500/[0.04] rounded-xl px-3 py-1.5">
      <SkullPumpIcon />
      <div className="space-y-0.5">
        {diesel && (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest w-10 hidden sm:block">Diesel</span>
            <span className="text-xs font-bold text-yellow-400 tabular-nums">
              {diesel.price.toFixed(3).replace(".", ",")} €
            </span>
            {diesel.change !== 0 && (
              <span className={`text-[9px] font-semibold ${diesel.change > 0 ? "text-red-400" : "text-green-400"}`}>
                {diesel.change > 0 ? "▲" : "▼"}
              </span>
            )}
          </div>
        )}
        {e5 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest w-10 hidden sm:block">E5</span>
            <span className="text-xs font-bold text-yellow-400 tabular-nums">
              {e5.price.toFixed(3).replace(".", ",")} €
            </span>
            {e5.change !== 0 && (
              <span className={`text-[9px] font-semibold ${e5.change > 0 ? "text-red-400" : "text-green-400"}`}>
                {e5.change > 0 ? "▲" : "▼"}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1 pt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLive ? "bg-green-400" : "bg-zinc-600"}`} />
          <span className="text-[8px] text-zinc-600 uppercase tracking-widest hidden sm:block">
            {isLive ? "Live" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}
