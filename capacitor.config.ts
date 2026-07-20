import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bicmas.academy",
  appName: "MeCure Academy",
  webDir: "dist",
  // Allow http:// API calls during local device testing (LAN IP).
  server: {
    cleartext: true,
  },
  // Let OneSignal own iOS push registration (avoids APNs delegate conflicts).
  ios: {
    handleApplicationNotifications: false,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
