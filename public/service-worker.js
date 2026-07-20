const CACHE_NAME = "mecure-academy-app-v2";

const isDevHost =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

/* ---------------- INSTALL ---------------- */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

/* ---------------- ACTIVATE ---------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---------------- PUSH EVENT ---------------- */
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "MeCure Academy Announcement",
      body: event.data?.text(),
    };
  }

  const title = data.title || "MeCure Academy Announcement";

  const options = {
    body: data.body || "New announcement available",
    icon: "/img/mecure-industries-logo.png",
    badge: "/img/mecure-industries-logo.png",
    tag: "mecure-academy-announcement",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ---------------- NOTIFICATION CLICK ---------------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).toString();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }
    )
  );
});

/* ---------------- FETCH / CACHING ---------------- */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  // Never cache during local Vite development — stale modules cause blank screens.
  if (isDevHost) {
    return;
  }

  const url = new URL(request.url);
  const isApiRequest = url.pathname.includes("/api/");

  // API requests → network only (do not serve stale API responses from cache)
  if (isApiRequest) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML / module scripts → network first (avoid blank screens from stale bundles)
  const accept = request.headers.get("accept") || "";
  const isModule =
    accept.includes("text/html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".tsx") ||
    url.pathname.endsWith(".ts") ||
    url.pathname.includes("/src/");

  if (isModule) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Static assets → cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          if (!response.ok || response.type === "opaque") {
            return response;
          }

          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });

          return response;
        })
      );
    })
  );
});
