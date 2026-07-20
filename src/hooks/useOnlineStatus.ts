import { useEffect, useState } from "react";

// Returns true when the browser is online, updates on online/offline events.
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);

    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return isOnline;
};
