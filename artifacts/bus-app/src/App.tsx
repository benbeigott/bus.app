import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginScreen from "@/pages/LoginScreen";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

export type UserRole = "partner" | "master" | null;
export interface UserSession {
  role: UserRole;
  name: string;
  partnerId?: string;
}

function App() {
  const [session, setSession] = useState<UserSession | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      {!session ? (
        <LoginScreen onLogin={setSession} />
      ) : (
        <Dashboard session={session} onLogout={() => setSession(null)} />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
