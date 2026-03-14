import { useState } from "react";
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
  const [masterCode, setMasterCode] = useState("");
  const [partnerError, setPartnerError] = useState("");
  const [masterError, setMasterError] = useState("");
  const [showMaster, setShowMaster] = useState(false);

  function handlePartnerLogin(e: React.FormEvent) {
    e.preventDefault();
    setPartnerError("");
    const found = PARTNERS.find(
      (p) => p.id === partnerId.trim().toUpperCase() && p.code === partnerCode
    );
    if (found) {
      onLogin({ role: "partner", name: found.name, partnerId: found.id });
    } else {
      setPartnerError("Partner-ID oder Code ungültig.");
    }
  }

  function handleMasterLogin(e: React.FormEvent) {
    e.preventDefault();
    setMasterError("");
    if (masterCode === MASTER_CODE) {
      onLogin({ role: "master", name: "Master Controller" });
    } else {
      setMasterError("Master-Code ungültig.");
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar with live clock */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500 pulse-gold" />
          <span className="text-xs text-zinc-500 uppercase tracking-widest">System Online</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-yellow-500 tabular-nums tracking-widest">{time}</div>
          <div className="text-xs text-zinc-600 mt-0.5">{dateStr}</div>
        </div>
      </div>

      {/* Main content */}
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

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Partner Login */}
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
                placeholder="Partner-ID (z.B. MZ001)"
                value={partnerId}
                onChange={e => setPartnerId(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-sm outline-none placeholder-zinc-600 focus:border-yellow-500/40 focus:bg-white/[0.05] transition-all"
                required
              />
              <input
                type="password"
                placeholder="Zugangscode"
                value={partnerCode}
                onChange={e => setPartnerCode(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-sm outline-none placeholder-zinc-600 focus:border-yellow-500/40 focus:bg-white/[0.05] transition-all"
                required
              />
              {partnerError && (
                <p className="text-xs text-red-400">{partnerError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300 text-black font-semibold text-sm tracking-wide rounded-lg hover:shadow-[0_8px_30px_rgba(201,162,39,0.3)] hover:-translate-y-0.5 transition-all"
              >
                EINLOGGEN
              </button>
            </form>
            <p className="text-xs text-zinc-600 text-center mt-6">
              Nur für freigeschaltete Busunternehmer.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 text-center">
              <p className="text-xs text-zinc-700">Demo: MZ001 / bus2026</p>
            </div>
          </div>

          {/* Master Access */}
          <div className="gold-border rounded-2xl p-8 relative">
            <div className="corner-tl" /><div className="corner-tr" />
            <div className="corner-bl" /><div className="corner-br" />
            <div className="text-center mb-8">
              <p className="text-xs text-zinc-500 uppercase tracking-[0.2em] mb-2">Administrative Control</p>
              <h2 className="text-xl font-semibold text-white">👑 Master Access</h2>
            </div>
            <form onSubmit={handleMasterLogin} className="space-y-4">
              <input
                type={showMaster ? "text" : "password"}
                placeholder="Master-Code"
                value={masterCode}
                onChange={e => setMasterCode(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-sm outline-none placeholder-zinc-600 focus:border-yellow-500/40 focus:bg-white/[0.05] transition-all"
                required
              />
              {masterError && (
                <p className="text-xs text-red-400">{masterError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3.5 bg-transparent border border-yellow-500/30 text-yellow-500 font-semibold text-sm tracking-wide rounded-lg hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all"
              >
                KONTROLLE ÜBERNEHMEN
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Partner aktiv</span>
                  <span className="text-yellow-500 font-semibold">{PARTNERS.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Fahrzeuge gesamt</span>
                  <span className="text-yellow-500 font-semibold">7</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Buchungen aktiv</span>
                  <span className="text-yellow-500 font-semibold">15</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-zinc-700 text-center mt-4">Demo: master2026</p>
          </div>
        </div>
      </div>

      <footer className="text-center py-4">
        <p className="text-xs text-zinc-700">bus.app — Elite Fleet Management Platform</p>
      </footer>
    </div>
  );
}
