import { useState, useRef } from "react";
import { type UserSession } from "@/App";
import { PARTNERS, MASTER_CODE } from "@/lib/data";
import { useLiveClock } from "@/hooks/useLiveClock";

interface Props {
  onLogin: (session: UserSession) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const { time, dateStr } = useLiveClock();
  const [partnerId, setPartnerId] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [error, setError] = useState("");

  // Hidden master access — 5 quick taps on the status dot
  const [masterOverlay, setMasterOverlay] = useState(false);
  const [masterCode, setMasterCode] = useState("");
  const [masterError, setMasterError] = useState("");
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDotTap() {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1500);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setMasterOverlay(true);
      setMasterCode("");
      setMasterError("");
    }
  }

  function handlePartnerLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const found = PARTNERS.find(
      (p) => p.id === partnerId.trim().toUpperCase() && p.code === partnerCode
    );
    if (found) {
      onLogin({ role: "partner", name: found.name, partnerId: found.id });
    } else {
      setError("Partner-ID oder Code ungültig.");
    }
  }

  function handleMasterLogin(e: React.FormEvent) {
    e.preventDefault();
    setMasterError("");
    if (masterCode === MASTER_CODE) {
      setMasterOverlay(false);
      onLogin({ role: "master", name: "System Control" });
    } else {
      setMasterError("Ungültig.");
      setTimeout(() => setMasterError(""), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top status bar */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          {/* Secret tap target — visually just a status dot */}
          <button
            onClick={handleDotTap}
            className="w-2 h-2 rounded-full bg-yellow-500 pulse-gold focus:outline-none"
            style={{ cursor: "default" }}
            aria-hidden="true"
            tabIndex={-1}
          />
          <span className="text-xs text-zinc-500 uppercase tracking-widest">System Online</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-yellow-500 tabular-nums tracking-widest">{time}</div>
          <div className="text-xs text-zinc-600 mt-0.5">{dateStr}</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-14">
          <p className="text-xs text-zinc-600 uppercase tracking-[0.35em] mb-3">Fleet Operations Platform</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-5xl font-bold text-white tracking-tight">bus</span>
            <span className="text-5xl font-bold text-yellow-500 tracking-tight">.app</span>
          </div>
          <p className="text-xs text-zinc-600 uppercase tracking-[0.25em] mt-3">Das Mutterschiff der Flottenplanung</p>
        </div>

        {/* Single partner login card */}
        <div className="w-full max-w-sm">
          <div className="gold-border rounded-2xl p-8 relative gold-glow">
            <div className="corner-tl" /><div className="corner-tr" />
            <div className="corner-bl" /><div className="corner-br" />
            <div className="text-center mb-8">
              <p className="text-xs text-zinc-500 uppercase tracking-[0.2em] mb-2">Elite Dispatch Access</p>
              <h2 className="text-xl font-semibold text-white">PARTNER LOGIN</h2>
            </div>
            <form onSubmit={handlePartnerLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Partner-ID"
                value={partnerId}
                onChange={e => setPartnerId(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-sm outline-none placeholder-zinc-600 focus:border-yellow-500/40 focus:bg-white/[0.05] transition-all"
                required
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="Zugangscode"
                value={partnerCode}
                onChange={e => setPartnerCode(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-sm outline-none placeholder-zinc-600 focus:border-yellow-500/40 focus:bg-white/[0.05] transition-all"
                required
                autoComplete="current-password"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300 text-black font-semibold text-sm tracking-wide rounded-lg hover:shadow-[0_8px_30px_rgba(201,162,39,0.3)] hover:-translate-y-0.5 transition-all mt-2"
              >
                EINLOGGEN
              </button>
            </form>
            <p className="text-xs text-zinc-700 text-center mt-6">
              Nur für freigeschaltete Busunternehmer.
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center py-4">
        <p className="text-xs text-zinc-800">bus.app</p>
      </footer>

      {/* Hidden master overlay — appears only after secret tap sequence */}
      {masterOverlay && (
        <div
          className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) { setMasterOverlay(false); } }}
        >
          <div
            className="w-full max-w-xs"
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleMasterLogin} className="space-y-4">
              <input
                type="password"
                placeholder="——————————"
                value={masterCode}
                onChange={e => setMasterCode(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-sm outline-none placeholder-zinc-800 focus:border-yellow-500/20 transition-all text-center tracking-[0.4em]"
                autoFocus
                autoComplete="off"
              />
              {masterError && (
                <p className="text-xs text-red-400 text-center">{masterError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 border border-white/[0.06] text-zinc-700 text-xs rounded-lg hover:border-yellow-500/20 hover:text-zinc-500 transition-all tracking-widest"
              >
                ——
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
