import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Refresh course data when app comes to foreground
 * This ensures users see newly assigned courses when they switch back to the app
 */
export const useRefreshOnForeground = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleAppForeground = async () => {
      console.log("App came to foreground, refreshing data...");
      
      // Invalidate cached course data to force a refetch
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["assignedCourses"] });
      await queryClient.invalidateQueries({ queryKey: ["learningPaths"] });
    };

    // Listen for app foreground event (custom event from Capacitor hook)
    window.addEventListener("app-foreground", handleAppForeground);

    // Also handle page visibility changes for better UX on web
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleAppForeground();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("app-foreground", handleAppForeground);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);
};
