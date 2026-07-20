/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  /**
   * Set to "true" only after adding Firebase `google-services.json` (FCM).
   * Without it, native PushNotifications.register() can crash on Android.
   */
  readonly VITE_ANDROID_USE_NATIVE_FCM?: string;
  /** API base including /api/v1, e.g. https://host/api/v1 */
  readonly VITE_API_BASE_URL?: string;
  /** Path or full URL for token refresh (default /auth/refresh under VITE_API_BASE_URL) */
  readonly VITE_AUTH_REFRESH_PATH?: string;
  /** JSON body key for refresh token (default refreshToken) */
  readonly VITE_AUTH_REFRESH_TOKEN_FIELD?: string;
  /** Full URL for AI chat proxy (backend must accept Bearer + { message, context }) */
  readonly VITE_AI_CHAT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}