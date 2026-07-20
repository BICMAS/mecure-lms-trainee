import { getApiV1BaseUrl } from "@/config/api";
import { fetchWithAuthRetry } from "@/utils/fetchWithAuthRetry";

export type WebPushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

/**
 * Persist a browser PushSubscription so the backend can send Web Push.
 * Body matches PushManager.subscribe() / subscription.toJSON().
 */
export async function subscribePush(
  subscription: PushSubscription | WebPushSubscriptionPayload,
): Promise<void> {
  const json =
    typeof (subscription as PushSubscription).toJSON === "function"
      ? (subscription as PushSubscription).toJSON()
      : (subscription as WebPushSubscriptionPayload);

  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Invalid push subscription: missing endpoint or keys");
  }

  const res = await fetchWithAuthRetry(`${getApiV1BaseUrl()}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint,
      keys: { p256dh, auth },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        `Failed to save push subscription (${res.status})`,
    );
  }
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  const res = await fetchWithAuthRetry(`${getApiV1BaseUrl()}/push/subscribe`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        `Failed to remove push subscription (${res.status})`,
    );
  }
}
