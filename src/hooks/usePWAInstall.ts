import { useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();
      deferredPromptRef.current = event;
      setIsInstallable(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false);
      deferredPromptRef.current = null;
      
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const promptInstall = async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return;

    try {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      // Result is handled but we clear the event regardless
      if (result.outcome === "accepted") {
        // Installation accepted - event is already consumed
      }
    } catch (error) {
      // Handle error if prompt throws
      console.error("PWA install prompt failed:", error);
    } finally {
      // Always clear the stale event immediately after prompt() to prevent reuse
      deferredPromptRef.current = null;
      setIsInstallable(false);
    }
  };

  return { isInstallable, isInstalled, promptInstall };
}
