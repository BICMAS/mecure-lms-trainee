/**
 * Decode JWT payload (no signature verification — UX only).
 */
function decodeJwtPayload(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded =
      pad === 0 ? base64 : base64 + "=".repeat(4 - pad);
    return JSON.parse(atob(padded)) as { exp?: number; iat?: number };
  } catch {
    return null;
  }
}

/** Access token lifetime cap (align with backend JWT expiry, typically 24h). */
export const ACCESS_TOKEN_MAX_SESSION_MS = 24 * 60 * 60 * 1000;

/** Small skew so we logout slightly before the server rejects the token. */
const EXPIRY_SKEW_MS = 5_000;

export function getJwtExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (typeof payload?.exp !== "number") return null;
  return payload.exp * 1000;
}

export function getJwtIssuedAtMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (typeof payload?.iat !== "number") return null;
  return payload.iat * 1000;
}

/**
 * Earliest moment we should end the session: JWT exp or 24h after login, whichever is sooner.
 */
export function getSessionEndTimeMs(
  accessToken: string,
  sessionStartedAtMs: number,
): number {
  const jwtExp = getJwtExpiryMs(accessToken);
  const loginCap = sessionStartedAtMs + ACCESS_TOKEN_MAX_SESSION_MS;
  if (jwtExp == null) return loginCap;
  return Math.min(jwtExp - EXPIRY_SKEW_MS, loginCap);
}

export function isAccessTokenExpiredByClock(
  accessToken: string,
  sessionStartedAtMs: number,
): boolean {
  return Date.now() >= getSessionEndTimeMs(accessToken, sessionStartedAtMs);
}
