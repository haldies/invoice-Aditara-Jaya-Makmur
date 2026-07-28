const CACHE_NAME = "lokerhub-v1";
const ASSETS_TO_CACHE = [
  "/manifest.json",
  "/favicon.ico",
];

// Install Event: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: network-first strategy with cache fallback for pages/assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API routes, auth, and database queries - always go to network
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return;
  }

  // For other requests: Network-First strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache the response if it's a valid static resource
        if (
          response &&
          response.status === 200 &&
          (url.pathname.startsWith("/_next/static/") ||
            url.pathname.startsWith("/icons/") ||
            url.pathname.startsWith("/images/"))
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // Fallback to cache if network is down
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return Response.error();
      })
  );
});
