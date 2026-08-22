const CACHE_NAME = "rarotonga-honeymoon-v55";
const APP_SHELL = [
  "/",
  "/favicon.svg",
  "/manifest.webmanifest",
  "/icons/apple-touch-icon.png",
  "/icons/app-icon-192.png",
  "/icons/app-icon-512.png",
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached || caches.match("/"));
    }),
  );
});
