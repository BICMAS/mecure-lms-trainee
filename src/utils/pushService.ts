import { Capacitor } from "@capacitor/core";
import { subscribePush } from "@/api/push";
import {
  getLastOneSignalFailureReason,
  registerOneSignalPush,
  shouldUseOneSignalPush,
} from "@/utils/oneSignalService";

const NOTIFICATIONS_ENABLED_KEY = "notificationsEnabled";

/** Set when web push registration returns null so the UI can explain why. */
let lastWebPushFailureReason: string | null = null;

export const getLastWebPushFailureReason = () =>
  lastWebPushFailureReason ?? getLastOneSignalFailureReason();

/** Persist Web Push subscription to the API when we have a PushSubscription. */
async function persistWebPushSubscription(
  subscription: PushSubscription,
): Promise<void> {
  try {
    await subscribePush(subscription);
  } catch (error) {
    console.error("Failed to save push subscription on server", error);
    lastWebPushFailureReason =
      error instanceof Error
        ? `Registered locally but failed to save on server: ${error.message}`
        : "Registered locally but failed to save on server.";
    throw error;
  }
}

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(normalized);

  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
};

const canUsePushNotifications = () =>
  typeof window !== "undefined" &&
  typeof navigator !== "undefined" &&
  window.isSecureContext &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

/** True for iPhone / iPad Safari (and Chrome/Firefox on iOS, which use WebKit). */
export const isIosDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
};

/** Home Screen / installed PWA (required for Web Push on iOS). */
export const isStandaloneDisplayMode = (): boolean => {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
};

/**
 * Why web push cannot be used right now (browser / PWA).
 * Returns null when the environment looks capable.
 */
export const getWebPushUnavailableReason = (): string | null => {
  if (typeof window === "undefined") {
    return "Notifications are not available in this environment.";
  }

  if (Capacitor.isNativePlatform()) {
    return "Web Push is not available in the native app WebView. Set VITE_ONESIGNAL_APP_ID and rebuild the APK, or use native FCM.";
  }

  if (!window.isSecureContext) {
    return "Notifications require HTTPS (or localhost).";
  }

  // iOS only supports Web Push for Home Screen web apps (iOS 16.4+), not Safari tabs.
  if (isIosDevice() && !isStandaloneDisplayMode()) {
    return "On iPhone/iPad, open Share → Add to Home Screen, launch MeCure Academy from the home screen icon, then tap Enable Notifications. Safari tabs cannot receive web push.";
  }

  if (!("Notification" in window)) {
    return "This browser does not support notifications.";
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    if (isIosDevice()) {
      return "Web Push needs iOS 16.4+ and the app opened from your Home Screen (not a Safari tab). Update iOS if needed, then try again from the home screen icon.";
    }
    return "This browser does not support Web Push. Try Chrome or Edge on desktop, or install the Android app for mobile alerts.";
  }

  return null;
};

export const getNotificationPermission = () =>
  typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "unsupported";

export const hasEnabledNotifications = () => {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === "true";
  } catch {
    return false;
  }
};

const setNotificationsEnabled = (enabled: boolean) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
  } catch {
    // Ignore storage failures and rely on runtime permission state.
  }
};

/**
 * Legacy Capacitor FCM path (without OneSignal). Prefers OneSignal when
 * VITE_ONESIGNAL_APP_ID is set.
 */
function shouldUseNativeCapacitorPush(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  if (shouldUseOneSignalPush()) return false;

  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    if (import.meta.env.VITE_ANDROID_USE_NATIVE_FCM === "true") {
      return true;
    }
    if (import.meta.env.VITE_VAPID_PUBLIC_KEY) {
      return false;
    }
    return false;
  }

  return true;
}

let capacitorListenersRegistered = false;

const registerCapacitorPushNotifications = async () => {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permission = await PushNotifications.requestPermissions();

  if (permission.receive !== "granted") {
    console.warn("Push notification permissions not granted");
    setNotificationsEnabled(false);
    return null;
  }

  if (!capacitorListenersRegistered) {
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Push notification received:", notification);
    });

    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        console.log("Push notification action performed:", notification);
      },
    );

    capacitorListenersRegistered = true;
  }

  await PushNotifications.register();

  setNotificationsEnabled(true);
  return { registered: true as const, provider: "capacitor" as const };
};

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Ensure a service worker is registered. In Vite DEV, index.tsx unregisters SWs
 * for HMR — so we must register here when enabling notifications.
 */
async function ensurePushServiceWorker(): Promise<ServiceWorkerRegistration> {
  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    registration = await navigator.serviceWorker.register("/service-worker.js");
  }

  return withTimeout(
    navigator.serviceWorker.ready,
    12_000,
    "Service worker did not become ready. Reload the page and try again.",
  );
}

const registerWebPushNotifications = async () => {
  lastWebPushFailureReason = null;

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    lastWebPushFailureReason =
      "This app build has no VITE_VAPID_PUBLIC_KEY embedded. Add it to .env or .env.production, then run pnpm build and rebuild the APK. (Vercel env only applies to the web deploy, not to mobile builds.)";
    console.warn(
      "Push notifications are disabled: missing VITE_VAPID_PUBLIC_KEY.",
    );
    return null;
  }

  if (!canUsePushNotifications()) {
    lastWebPushFailureReason =
      getWebPushUnavailableReason() ??
      "Web Push is not available in this browser.";
    return null;
  }

  let registration: ServiceWorkerRegistration;
  try {
    registration = await ensurePushServiceWorker();
  } catch (error) {
    lastWebPushFailureReason =
      error instanceof Error
        ? error.message
        : "Could not register the service worker for notifications.";
    return null;
  }

  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    await persistWebPushSubscription(existingSubscription);
    setNotificationsEnabled(true);
    return existingSubscription;
  }

  let permission = Notification.permission;

  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    setNotificationsEnabled(false);
    lastWebPushFailureReason =
      permission === "denied"
        ? "Notifications are blocked. Click the lock icon in the address bar → allow notifications, then try again."
        : "Notification permission was not granted.";
    return null;
  }

  try {
    const subscription = await withTimeout(
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }),
      15_000,
      "Browser push subscribe timed out. Reload and try again.",
    );

    import.meta.env.DEV &&
      console.debug("[Push] Web Push subscription OK:", subscription.endpoint);

    await withTimeout(
      persistWebPushSubscription(subscription),
      15_000,
      "Saved locally but the server did not respond. Check that the API is running.",
    );
    setNotificationsEnabled(true);
    return subscription;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    lastWebPushFailureReason = `Could not enable notifications: ${msg}`;
    return null;
  }
};

/**
 * Register for push.
 * - Native + OneSignal App ID → OneSignal (mobile)
 * - Native + FCM flag → Capacitor PushNotifications
 * - Otherwise → Web Push (browser / PWA)
 *
 * @param externalUserId Backend user id for OneSignal.login (External ID)
 */
export const registerPushNotifications = async (
  externalUserId?: string | null,
) => {
  try {
    if (shouldUseOneSignalPush()) {
      const result = await registerOneSignalPush(externalUserId);
      if (result) {
        setNotificationsEnabled(true);
      } else {
        setNotificationsEnabled(false);
      }
      return result;
    }

    if (shouldUseNativeCapacitorPush()) {
      return await registerCapacitorPushNotifications();
    }

    return await registerWebPushNotifications();
  } catch (error) {
    console.error("Failed to register push notifications", error);
    setNotificationsEnabled(false);
    if (!lastWebPushFailureReason && error instanceof Error) {
      lastWebPushFailureReason = error.message;
    }
    return null;
  }
};

/** User-facing hint when Android cannot enable push. */
export const getPushUnavailableHint = (): string | null => {
  if (!Capacitor.isNativePlatform()) return null;
  if (Capacitor.getPlatform() !== "android") return null;
  if (import.meta.env.VITE_ONESIGNAL_APP_ID) return null;
  if (import.meta.env.VITE_VAPID_PUBLIC_KEY) return null;
  if (import.meta.env.VITE_ANDROID_USE_NATIVE_FCM === "true") return null;
  return "To enable mobile push: set VITE_ONESIGNAL_APP_ID (recommended), or use VITE_VAPID_PUBLIC_KEY / Firebase FCM.";
};
