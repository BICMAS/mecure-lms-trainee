import { refreshSession } from "@/api/auth";
import { getAccessToken } from "@/utils/auth";

/**
 * Authenticated fetch: retries once after refreshing the access token on 401.
 */
export async function fetchWithAuthRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const build = () => {
    const headers = new Headers(init?.headers);
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  };

  let res = await fetch(input, { ...init, headers: build() });

  if (res.status !== 401) {
    return res;
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    return res;
  }

  return fetch(input, { ...init, headers: build() });
}
