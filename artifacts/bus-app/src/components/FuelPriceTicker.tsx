import { type FuelPrice } from "@/lib/data";

// ⛽ + ☠️ combined: red fuel pump with skull replacing the center droplet
function SkullPumpIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* === PUMP BODY (red, like ⛽ emoji) === */}
      {/* Main body */}
      <rect x="6" y="20" width="36" height="40" rx="4" fill="#CC2200" />
      {/* Top roof piece */}
      <rect x="4" y="16" width="40" height="8" rx="3" fill="#AA1800" />
      {/* Body shading right side */}
      <rect x="34" y="20" width="8" height="40" rx="0" fill="#AA1800" opacity="0.5" />

      {/* === SKULL (☠️ style) replacing the center panel === */}
      {/* Panel background */}
      <rect x="11" y="25" width="26" height="22" rx="3" fill="#1a0a00" />
      {/* Skull cranium */}
      <ellipse cx="24" cy="33" rx="9" ry="8" fill="white" />
      {/* Left eye socket */}
      <ellipse cx="20.5" cy="33" rx="2.8" ry="3" fill="#1a0a00" />
      {/* Right eye socket */}
      <ellipse cx="27.5" cy="33" rx="2.8" ry="3" fill="#1a0a00" />
      {/* Nose cavity */}
      <path d="M22.5 37 L24 39.5 L25.5 37 Z" fill="#1a0a00" />
      {/* Jaw / lower skull */}
      <rect x="16" y="39" width="16" height="6" rx="2" fill="white" />
      {/* Teeth gaps */}
      <rect x="18.5" y="39.5" width="2.5" height="5" rx="0.5" fill="#1a0a00" />
      <rect x="22.5" y="39.5" width="2.5" height="5" rx="0.5" fill="#1a0a00" />
      <rect x="26.5" y="39.5" width="2.5" height="5" rx="0.5" fill="#1a0a00" />

      {/* === NOZZLE ARM (right side) === */}
      {/* Vertical pipe */}
      <rect x="42" y="18" width="6" height="16" rx="3" fill="#CC2200" />
      {/* Horizontal hose */}
      <path d="M45 34 Q52 34 52 44 L52 52" stroke="#882200" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Nozzle tip */}
      <rect x="48" y="50" width="8" height="5" rx="2.5" fill="#CC2200" />
      <rect x="54" y="48" width="4" height="9" rx="2" fill="#AA1800" />

      {/* === PUMP BASE === */}
      <rect x="6" y="56" width="36" height="6" rx="2" fill="#881500" />

      {/* === SHINE highlight === */}
      <rect x="10" y="22" width="4" height="14" rx="2" fill="white" opacity="0.15" />
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
    <div className="flex items-center gap-2 border border-red-900/30 bg-red-950/10 rounded-xl px-3 py-1.5">
      <SkullPumpIcon size={40} />
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
