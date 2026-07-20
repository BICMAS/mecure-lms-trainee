import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  getAccessToken,
  clearAuth,
  getSessionStartedAtMs,
  getStoredUser,
  resolveTraineeDisplayName,
  saveAuth,
  type AuthUser,
} from "@/utils/auth";
import {
  getSessionEndTimeMs,
  isAccessTokenExpiredByClock,
} from "@/utils/jwt";

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (data: any) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const redirectToLoginIfNeeded = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getAccessToken());

  const logout = useCallback(() => {
    void import("@/utils/oneSignalService").then(({ logoutOneSignalUser }) => {
      void logoutOneSignalUser();
    });
    clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  const login = (data: any) => {
    if (!data || !data.user) {
      throw new Error("Invalid login response: missing user data");
    }

    const userData = data.user;
    const email = userData?.email ?? "";
    const displayName = resolveTraineeDisplayName({
      fullName: userData?.fullName,
      name: userData?.name,
      email,
      phoneNumber: userData?.phoneNumber,
      phone: userData?.phone,
    });
    const avatarSeed = email || userData?.id || displayName;
    const avatar = `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(
      avatarSeed,
    )}`;

    const formattedUser: AuthUser = {
      id: userData?.id ?? "",
      name: displayName,
      fullName: displayName,
      email,
      role: "Trainee",
      avatar,
    };

    saveAuth({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      user: formattedUser,
    });

    setToken(data.accessToken);
    setUser(formattedUser);

    // Link OneSignal subscription to this user (External ID = backend user id)
    if (formattedUser.id) {
      void import("@/utils/oneSignalService").then(({ loginOneSignalUser }) => {
        void loginOneSignalUser(formattedUser.id);
      });
    }
  };

  /** Log out when JWT or 24h session cap is reached; always send user to login. */
  const logoutDueToExpiredSession = useCallback(() => {
    logout();
    redirectToLoginIfNeeded();
  }, [logout]);

  useEffect(() => {
    const onRefreshed = (e: Event) => {
      const detail = (e as CustomEvent<{ accessToken: string }>).detail;
      if (detail?.accessToken) {
        setToken(detail.accessToken);
      }
    };

    const onExpired = () => {
      logout();
      redirectToLoginIfNeeded();
    };

    window.addEventListener("mecure:auth-refreshed", onRefreshed);
    window.addEventListener("mecure:auth-expired", onExpired);
    return () => {
      window.removeEventListener("mecure:auth-refreshed", onRefreshed);
      window.removeEventListener("mecure:auth-expired", onExpired);
    };
  }, [logout]);

  /** On load: if already past JWT exp or 24h from login, log out immediately. */
  useEffect(() => {
    const t = getAccessToken();
    if (!t) return;
    const started = getSessionStartedAtMs(t);
    if (isAccessTokenExpiredByClock(t, started)) {
      logoutDueToExpiredSession();
    }
  }, [logoutDueToExpiredSession]);

  /** Schedule automatic logout at min(JWT exp, login + 24h). */
  useEffect(() => {
    if (!token) return;

    const started = getSessionStartedAtMs(token);
    const endAt = getSessionEndTimeMs(token, started);
    const delay = endAt - Date.now();

    if (delay <= 0) {
      logoutDueToExpiredSession();
      return;
    }

    const id = window.setTimeout(logoutDueToExpiredSession, delay);
    return () => window.clearTimeout(id);
  }, [token, logoutDueToExpiredSession]);

  /** Tab focus: timers may be throttled; re-check expiry. */
  useEffect(() => {
    const check = () => {
      const t = getAccessToken();
      if (!t) return;
      const started = getSessionStartedAtMs(t);
      if (isAccessTokenExpiredByClock(t, started)) {
        logoutDueToExpiredSession();
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") check();
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [logoutDueToExpiredSession]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
