const CACHE_NAME = "rarotonga-honeymoon-v58";
const APP_SHELL = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/icons/apple-touch-icon.png",
  "/icons/app-icon-192.png",
  "/icons/app-icon-512.png",
  "/icons/app-icon-1024.png",
  "/images/sea-change.webp",
  "/images/nautilus.webp",
  "/images/tamarind.webp",
  "/images/otb.jpg",
  "/images/rarotonga-aerial.jpg",
  "/images/muri-beach.jpg",
  "/images/muri-islets.jpg",
  "/images/rarotonga-peaks.jpg",
  "/images/lagoon-swim.jpg",
  "/images/south-coast-beach.jpg",
  "/images/turtles.webp",
  "/images/one-foot.jpg",
  "/images/blue-lagoon.jpg",
  "/images/map-rarotonga.jpg",
  "/images/map-aitutaki.jpg",
];

function isSameOrigin(url) {
  return new URL(url, self.location.href).origin === self.location.origin;
}

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  const uniqueUrls = [...new Set(urls.filter(Boolean).filter(isSameOrigin))];

  await Promise.allSettled(
    uniqueUrls.map(async (url) => {
      const cacheRequest = new Request(url);
      const response = await fetch(new Request(url, { cache: "reload" }));

      if (response.ok) {
        await cache.put(cacheRequest, response);
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheUrls(APP_SHELL).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "CACHE_OFFLINE") {
    const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
    event.waitUntil(cacheUrls([...APP_SHELL, ...urls]));
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (!isSameOrigin(event.request.url)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        });

      if (cached) {
        event.waitUntil(network.catch(() => undefined));
        return cached;
      }

      return network.catch(() => caches.match("/"));
    }),
  );
});
