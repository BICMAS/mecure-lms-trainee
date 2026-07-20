import { Capacitor } from "@capacitor/core";

let initialized = false;
let lastOneSignalFailureReason: string | null = null;

export const getLastOneSignalFailureReason = () => lastOneSignalFailureReason;

export function getOneSignalAppId(): string | null {
  const id = import.meta.env.VITE_ONESIGNAL_APP_ID?.trim();
  return id || null;
}

export function isOneSignalConfigured(): boolean {
  return Boolean(getOneSignalAppId());
}

/** True when we should use OneSignal for native (Android/iOS) push. */
export function shouldUseOneSignalPush(): boolean {
  return Capacitor.isNativePlatform() && isOneSignalConfigured();
}

async function getOneSignal() {
  const mod = await import("@onesignal/capacitor-plugin");
  return mod.default;
}

/**
 * Initialize OneSignal once on native platforms.
 * Safe to call multiple times; no-ops on web or when App ID is missing.
 */
export async function initializeOneSignal(): Promise<boolean> {
  lastOneSignalFailureReason = null;

  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  const appId = getOneSignalAppId();
  if (!appId) {
    lastOneSignalFailureReason =
      "Missing VITE_ONESIGNAL_APP_ID. Add your OneSignal App ID to .env / .env.local and rebuild the APK.";
    return false;
  }

  if (initialized) {
    return true;
  }

  try {
    const OneSignal = await getOneSignal();
    if (import.meta.env.DEV) {
      // Verbose logs help confirm FCM/APNs registration during development.
      OneSignal.Debug?.setLogLevel?.(6);
    }
    await OneSignal.initialize(appId);
    initialized = true;
    return true;
  } catch (error) {
    console.error("[OneSignal] initialize failed", error);
    lastOneSignalFailureReason =
      error instanceof Error ? error.message : "OneSignal initialize failed";
    return false;
  }
}

/** Link this device subscription to your backend user id (OneSignal External ID). */
export async function loginOneSignalUser(externalUserId: string): Promise<void> {
  if (!externalUserId || !Capacitor.isNativePlatform()) return;
  const ok = await initializeOneSignal();
  if (!ok) return;

  const OneSignal = await getOneSignal();
  await OneSignal.login(externalUserId);
}

export async function logoutOneSignalUser(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !initialized) return;
  try {
    const OneSignal = await getOneSignal();
    await OneSignal.logout();
  } catch (error) {
    console.warn("[OneSignal] logout failed", error);
  }
}

/**
 * Request permission and ensure the device is subscribed for push.
 * Call after login so External ID is already set when possible.
 */
export async function registerOneSignalPush(
  externalUserId?: string | null,
): Promise<{ registered: true; provider: "onesignal" } | null> {
  lastOneSignalFailureReason = null;

  const ok = await initializeOneSignal();
  if (!ok) {
    return null;
  }

  try {
    const OneSignal = await getOneSignal();

    if (externalUserId) {
      await OneSignal.login(externalUserId);
    }

    const accepted = await OneSignal.Notifications.requestPermission(true);
    if (!accepted) {
      lastOneSignalFailureReason = "Notification permission was not granted.";
      return null;
    }

    return { registered: true, provider: "onesignal" };
  } catch (error) {
    console.error("[OneSignal] register failed", error);
    lastOneSignalFailureReason =
      error instanceof Error ? error.message : "OneSignal registration failed";
    return null;
  }
}
