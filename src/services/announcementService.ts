import { getApiV1BaseUrl } from "@/config/api";
import { getAccessToken } from "@/utils/auth";
import { fetchWithAuthRetry } from "@/utils/fetchWithAuthRetry";

export interface AnnouncementItem {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    fullName: string;
  };
}

export interface AnnouncementMeta {
  total: number;
  limit: number;
  offset: number;
  page: number;
  pageCount: number;
  hasMore: boolean;
}

export interface AnnouncementsPage {
  data: AnnouncementItem[];
  meta: AnnouncementMeta;
}

const DEFAULT_META: AnnouncementMeta = {
  total: 0,
  limit: 5,
  offset: 0,
  page: 1,
  pageCount: 0,
  hasMore: false,
};

export const getAnnouncementsPage = async (options?: {
  page?: number;
  limit?: number;
}): Promise<AnnouncementsPage> => {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 5;

  try {
    const token = getAccessToken();

    if (!token) {
      throw new Error("No access token available");
    }

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    const res = await fetchWithAuthRetry(
      `${getApiV1BaseUrl()}/announcements?${params}`,
    );

    if (!res.ok) {
      throw new Error(
        `Failed to fetch announcements: ${res.status} ${res.statusText}`,
      );
    }

    const result = await res.json();

    if (!result || typeof result !== "object") {
      throw new Error("Invalid announcements response format");
    }

    const data = Array.isArray(result.data) ? result.data : [];
    const meta = result.meta ?? {};

    return {
      data,
      meta: {
        total: meta.total ?? data.length,
        limit: meta.limit ?? limit,
        offset: meta.offset ?? (page - 1) * limit,
        page: meta.page ?? page,
        pageCount: meta.pageCount ?? 0,
        hasMore: Boolean(meta.hasMore),
      },
    };
  } catch (error) {
    console.error("getAnnouncementsPage failed", error);
    throw error;
  }
};

/** @deprecated Prefer getAnnouncementsPage for pagination meta */
export const getAnnouncements = async (options?: {
  page?: number;
  limit?: number;
}): Promise<AnnouncementItem[]> => {
  const { data } = await getAnnouncementsPage(options);
  return data;
};

export const showAnnouncementNotification = async (message: string) => {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") return;

  try {
    if (
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      new Notification("MeCure Academy Announcement", {
        body: message,
        icon: "/img/mecure-industries-logo.png",
        badge: "/img/mecure-industries-logo.png",
        tag: "mecure-academy-announcement",
      });
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      new Notification("MeCure Academy Announcement", {
        body: message,
        icon: "/img/mecure-industries-logo.png",
        badge: "/img/mecure-industries-logo.png",
        tag: "mecure-academy-announcement",
      });
      return;
    }

    await registration.showNotification("MeCure Academy Announcement", {
      body: message,
      icon: "/img/mecure-industries-logo.png",
      badge: "/img/mecure-industries-logo.png",
      tag: "mecure-academy-announcement",
    });
  } catch (error) {
    console.error("Failed to show announcement notification", error);
  }
};

export { DEFAULT_META };
