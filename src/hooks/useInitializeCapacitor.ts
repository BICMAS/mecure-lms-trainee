import { useEffect } from "react";
import { getStoredUser } from "@/utils/auth";
import {
  initializeOneSignal,
  loginOneSignalUser,
} from "@/utils/oneSignalService";

/**
 * Initialize Capacitor plugins on app startup
 * This ensures native features (push notifications, etc.) are properly registered
 */
export const useInitializeCapacitor = () => {
  useEffect(() => {
    const initializeCapacitor = async () => {
      try {
        // Check if Capacitor is available before importing
        if (!(window as any).Capacitor) {
          console.debug("Capacitor not available, skipping initialization");
          return;
        }

        // OneSignal: init early on native so the device can register for FCM/APNs
        await initializeOneSignal();
        const stored = getStoredUser();
        if (stored?.id) {
          await loginOneSignalUser(stored.id);
        }

        // Dynamically import Capacitor App (lazy loaded)
        let App;
        try {
          const capacitorApp = await import("@capacitor/app");
          App = capacitorApp.App;
        } catch (importError) {
          console.debug("@capacitor/app not installed:", importError);
          return;
        }

        // Register app state listeners for mobile
        App.addListener("appStateChange", (state: any) => {
          console.log("App state changed, active:", state.isActive);

          // Refresh data when app comes to foreground
          if (state.isActive) {
            window.dispatchEvent(new Event("app-foreground"));
          }
        });

        console.log("Capacitor App initialized");
      } catch (error) {
        // Not running on a native platform or Capacitor not available
        console.debug("Capacitor initialization failed:", error);
      }
    };

    initializeCapacitor();
  }, []);
};
