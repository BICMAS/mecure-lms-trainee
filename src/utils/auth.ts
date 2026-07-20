import { getJwtIssuedAtMs } from "@/utils/jwt";

const TOKEN_KEY = "access_token";
const USER_KEY = "auth_user";
const REFRESH_TOKEN_KEY = "refresh_token";
/** Wall-clock start of this login session (ms); used with JWT exp for max 24h session. */
const SESSION_STARTED_AT_KEY = "auth_session_started_at";

export type AuthUser = {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role: "Trainee";
  avatar: string;
};

/** Prefer API fullName; fall back to name / email local-part. */
export const resolveTraineeDisplayName = (userData: {
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  phone?: string | null;
}): string => {
  const fullName = userData.fullName?.trim();
  if (fullName) return fullName;

  const name = userData.name?.trim();
  if (name) return name;

  const email = userData.email?.trim();
  if (email?.includes("@")) return email.split("@")[0] ?? "User";

  const phone = userData.phoneNumber?.trim() || userData.phone?.trim();
  if (phone) return phone;

  return "User";
};

type StoredAuth = {
  accessToken: string;
  refreshToken?: string | null;
  user: AuthUser;
};

const getStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readItem = (key: string) => getStorage()?.getItem(key) ?? null;

const writeItem = (key: string, value: string) => {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const removeItem = (key: string) => {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const isAuthUserShape = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    (typeof candidate.name === "string" || typeof candidate.fullName === "string") &&
    typeof candidate.email === "string" &&
    candidate.role === "Trainee" &&
    typeof candidate.avatar === "string"
  );
};

const normalizeAuthUser = (value: Record<string, unknown>): AuthUser => {
  const displayName = resolveTraineeDisplayName({
    fullName: typeof value.fullName === "string" ? value.fullName : null,
    name: typeof value.name === "string" ? value.name : null,
    email: typeof value.email === "string" ? value.email : null,
  });

  return {
    id: value.id as string,
    name: displayName,
    fullName: displayName,
    email: value.email as string,
    role: "Trainee",
    avatar: value.avatar as string,
  };
};

export const getAccessToken = () => readItem(TOKEN_KEY);

export const getRefreshToken = () => readItem(REFRESH_TOKEN_KEY);

export const setAccessToken = (token: string) => writeItem(TOKEN_KEY, token);

export const setRefreshToken = (token: string | null) => {
  if (!token) {
    return removeItem(REFRESH_TOKEN_KEY);
  }

  return writeItem(REFRESH_TOKEN_KEY, token);
};

export const getStoredUser = (): AuthUser | null => {
  const raw = readItem(USER_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isAuthUserShape(parsed)) {
      removeItem(USER_KEY);
      return null;
    }

    return normalizeAuthUser(parsed);
  } catch (error) {
    console.error("Failed to parse stored user data:", error);
    removeItem(USER_KEY);
    return null;
  }
};

export const setStoredUser = (user: AuthUser) =>
  writeItem(USER_KEY, JSON.stringify(user));

const setSessionStartedAtNow = () =>
  writeItem(SESSION_STARTED_AT_KEY, String(Date.now()));

/**
 * Ms since epoch when the user signed in (new session). Used for the 24h cap.
 * Pass `accessToken` when the session key is missing (e.g. migration) to use JWT `iat`.
 */
export const getSessionStartedAtMs = (accessToken?: string | null): number => {
  const raw = readItem(SESSION_STARTED_AT_KEY);
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  if (accessToken) {
    const iat = getJwtIssuedAtMs(accessToken);
    if (iat != null) return iat;
  }
  return Date.now();
};

export const clearAuth = () => {
  removeItem(TOKEN_KEY);
  removeItem(REFRESH_TOKEN_KEY);
  removeItem(USER_KEY);
  removeItem(SESSION_STARTED_AT_KEY);
};

export const saveAuth = ({
  accessToken,
  refreshToken,
  user,
}: StoredAuth) => {
  setSessionStartedAtNow();
  const accessSaved = setAccessToken(accessToken);
  const refreshSaved = setRefreshToken(refreshToken ?? null);
  const userSaved = setStoredUser(user);

  return accessSaved && refreshSaved && userSaved;
};
