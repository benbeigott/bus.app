import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginScreen from "@/pages/LoginScreen";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "@/components/ui/toaster";
import { PARTNERS } from "@/lib/data";

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
  const [partners, setPartners] = useState<Partner[]>(PARTNERS);

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
        />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
