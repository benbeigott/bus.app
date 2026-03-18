import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginScreen from "@/pages/LoginScreen";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "@/components/ui/toaster";
import { PARTNERS, INITIAL_VEHICLES, INITIAL_BOOKINGS, INITIAL_DRIVERS, type Vehicle, type Booking, type Driver } from "@/lib/data";
import { DEFAULT_DEPOT, type DepotLocation } from "@/lib/depots";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const queryClient = new QueryClient();

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

function App() {
  const [session, setSession] = useState<UserSession | null>(null);

  const [partners, setPartners] = useLocalStorage<Partner[]>("bd_partners", PARTNERS);
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>("bd_vehicles", INITIAL_VEHICLES);
  const [bookings, setBookings] = useLocalStorage<Booking[]>("bd_bookings", INITIAL_BOOKINGS);
  const [drivers, setDrivers] = useLocalStorage<Driver[]>("bd_drivers", INITIAL_DRIVERS);
  const [depot, setDepot] = useLocalStorage<DepotLocation>("bd_depot", DEFAULT_DEPOT);

  return (
    <QueryClientProvider client={queryClient}>
      {!session ? (
        <LoginScreen onLogin={setSession} partners={partners} />
      ) : (
        <Dashboard
          session={session}
          onLogout={() => setSession(null)}
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
