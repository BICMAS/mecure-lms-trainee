import Router from "./router";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { PWAIOSBanner } from "@/components/PWAIOSBanner";
import { useInitializeCapacitor } from "@/hooks/useInitializeCapacitor";
import { useRefreshOnForeground } from "@/hooks/useRefreshOnForeground";

const queryClient = new QueryClient();

function AppContent() {
  // Initialize Capacitor plugins
  useInitializeCapacitor();
  
  // Refresh data when app comes to foreground
  useRefreshOnForeground();

  return (
    <>
      <Router />
      <PWAInstallBanner />
      <PWAIOSBanner />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}