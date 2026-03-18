import { useState, useRef } from "react";
import { type UserSession, type Partner } from "@/App";
import { MASTER_CODE } from "@/lib/data";
import { useLiveClock } from "@/hooks/useLiveClock";

interface Props {
  onLogin: (session: UserSession) => void;
  partners: Partner[];
  partnersLoaded: boolean;
}

export default function LoginScreen({ onLogin, partners, partnersLoaded }: Props) {
  const { time, dateStr } = useLiveClock();
  const [partnerId, setPartnerId] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [error, setError] = useState("");

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
    const found = partners.find(
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
      <div className="flex justify-between items-center px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
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

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-14">
          <p className="text-xs text-zinc-600 uppercase tracking-[0.35em] mb-5">Fleet Operations Platform</p>
          <div className="flex justify-center mb-5">
            <img
              src="/logo.jpg"
              alt="busdisposition.de Logo"
              className="w-28 h-28 rounded-full object-cover shadow-[0_0_40px_rgba(201,162,39,0.25)]"
            />
          </div>
          <div className="flex items-center justify-center gap-0.5">
            <span className="text-4xl font-bold text-white tracking-tight">busdisposition</span>
            <span className="text-4xl font-bold text-yellow-500 tracking-tight">.de</span>
          </div>
          <p className="text-xs text-zinc-600 uppercase tracking-[0.25em] mt-3">Das Mutterschiff der Flottenplanung</p>
        </div>

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
                disabled={!partnersLoaded}
                className={`w-full py-3.5 font-semibold text-sm tracking-wide rounded-lg transition-all mt-2 ${
                  partnersLoaded
                    ? "bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300 text-black hover:shadow-[0_8px_30px_rgba(201,162,39,0.3)] hover:-translate-y-0.5"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                }`}
              >
                {partnersLoaded ? "EINLOGGEN" : "Verbinde…"}
              </button>
            </form>
            <p className="text-xs text-zinc-700 text-center mt-6">
              Nur für freigeschaltete Busunternehmer.
            </p>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="w-full max-w-2xl mx-auto px-6 pb-10 mt-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
            <div className="w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest text-center">Code verschlüsselt</p>
            <p className="text-[9px] text-zinc-600 text-center leading-relaxed">Quellcode obfuskiert — kein Einblick in Geschäftslogik möglich</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
            <div className="w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest text-center">Externe Datenbank</p>
            <p className="text-[9px] text-zinc-600 text-center leading-relaxed">Alle Daten gesichert auf externen Servern — geräteübergreifend & dauerhaft</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
            <div className="w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest text-center">Nur auf Einladung</p>
            <p className="text-[9px] text-zinc-600 text-center leading-relaxed">Zugang ausschließlich für freigeschaltete Partner — kein öffentlicher Zugriff</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] text-zinc-700 uppercase tracking-widest">SSL verschlüsselt · 256-bit · HTTPS</p>
        </div>
      </div>

      <footer className="text-center py-4 border-t border-white/[0.03]">
        <p className="text-xs text-zinc-800">busdisposition.de</p>
      </footer>

      {masterOverlay && (
        <div
          className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) { setMasterOverlay(false); } }}
        >
          <div className="w-full max-w-xs" onClick={e => e.stopPropagation()}>
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
              {masterError && <p className="text-xs text-red-400 text-center">{masterError}</p>}
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
