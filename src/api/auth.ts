import {
  buildRefreshTokenRequestBody,
  getApiV1BaseUrl,
  getAuthRefreshUrl,
} from "@/config/api";
import {
  clearAuth,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/utils/auth";

const BASE_URL = getApiV1BaseUrl();

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Exchange refresh token for a new access token.
 * Deduplicates concurrent refresh calls. If backend route differs, align with server (e.g. /auth/refresh-token).
 */
export async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;

      const res = await fetch(getAuthRefreshUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: buildRefreshTokenRequestBody(refreshToken),
      });

      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        if (text) data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        data = {};
      }

      if (!res.ok) {
        clearAuth();
        window.dispatchEvent(new Event("mecure:auth-expired"));
        return false;
      }

      const nested = data.data as Record<string, unknown> | undefined;
      const accessToken =
        (data.accessToken as string | undefined) ??
        (data.token as string | undefined) ??
        (nested?.accessToken as string | undefined);

      if (!accessToken || typeof accessToken !== "string") {
        clearAuth();
        window.dispatchEvent(new Event("mecure:auth-expired"));
        return false;
      }

      setAccessToken(accessToken);

      const newRefresh =
        (data.refreshToken as string | undefined) ??
        (nested?.refreshToken as string | undefined);
      if (newRefresh) setRefreshToken(newRefresh);

      window.dispatchEvent(
        new CustomEvent("mecure:auth-refreshed", { detail: { accessToken } }),
      );
      return true;
    } catch {
      clearAuth();
      window.dispatchEvent(new Event("mecure:auth-expired"));
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    throw new Error('Empty response from server');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Authentication failed');
  }

  return data;
}

export async function loginWithEmail(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse(response);
}

export async function loginWithPhone(phoneNumber: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/phone-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, password }),
  });

  return parseResponse(response);
}