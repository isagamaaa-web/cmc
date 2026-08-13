/* Central Medium Clinic — offline pre-cache service worker */
const CACHE = "cmc-v8"; // Bumped cache version to invalidate old SW caches
const PRECACHE = [
  "/",
  "/booking",
  "/reschedule",
  "/services",
  "/booking-success",
  "/booking/confirmation",
  "/about",
  "/contact",
  "/favicon.png",
  "/robots.txt",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE.map((url) =>
            fetch(url, { credentials: "same-origin" })
              .then((res) => (res.ok ? cache.put(url, res) : null))
              .catch(() => null),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Let all non-GET requests pass directly through to the network without interception
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Never intercept API routes, server functions, or admin requests
  if (
    url.pathname.startsWith("/api") || 
    url.pathname.startsWith("/_serverFn") ||
    url.pathname.startsWith("/doctors")
  ) {
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(url.pathname, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(url.pathname);
          return cached || (await caches.match("/")) || Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});