import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginScreen from "@/pages/LoginScreen";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "@/components/ui/toaster";
import { PARTNERS, INITIAL_VEHICLES, INITIAL_BOOKINGS, INITIAL_DRIVERS, type Vehicle, type Booking, type Driver } from "@/lib/data";
import { DEFAULT_DEPOT, type DepotLocation } from "@/lib/depots";
import { useStore } from "@/hooks/useStore";

const queryClient = new QueryClient();

const SESSION_KEY = "bd_session";

export type UserRole = "partner" | "master" | null;
export interface UserSession {
  role: UserRole;
  name: string;
  partnerId?: string;
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  role: "partner";
}

function readStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserSession) : null;
  } catch { return null; }
}

function App() {
  const [session, setSession] = useState<UserSession | null>(readStoredSession);

  const [partners, setPartners, partnersLoaded] = useStore<Partner[]>("partners", PARTNERS);
  const [vehicles, setVehicles] = useStore<Vehicle[]>("vehicles", INITIAL_VEHICLES);
  const [bookings, setBookings] = useStore<Booking[]>("bookings", INITIAL_BOOKINGS);
  const [drivers, setDrivers] = useStore<Driver[]>("drivers", INITIAL_DRIVERS);
  const [depot, setDepot] = useStore<DepotLocation>("depot", DEFAULT_DEPOT);

  function handleLogin(s: UserSession) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
    setSession(s);
  }

  function handleLogout() {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setSession(null);
  }

  // If a partner account is deleted while this browser is logged in as that partner,
  // automatically log them out so they don't linger in an invalid session.
  useEffect(() => {
    if (!session || session.role !== "partner" || !partnersLoaded) return;
    const still = partners.some(p => p.id === session.partnerId);
    if (!still) handleLogout();
  }, [partners, partnersLoaded, session]);

  return (
    <QueryClientProvider client={queryClient}>
      {!session ? (
        <LoginScreen onLogin={handleLogin} partners={partners} partnersLoaded={partnersLoaded} />
      ) : (
        <Dashboard
          session={session}
          onLogout={handleLogout}
          partners={partners}
          onPartnersChange={setPartners}
          vehicles={vehicles}
          onVehiclesChange={setVehicles}
          bookings={bookings}
          onBookingsChange={setBookings}
          drivers={drivers}
          onDriversChange={setDrivers}
          depot={depot}
          onDepotChange={setDepot}
        />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
