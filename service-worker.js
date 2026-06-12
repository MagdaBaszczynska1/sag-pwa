/*
  Etap 6 i 7: service worker, tryb offline oraz testowanie PWA.
  Ten plik zapisuje podstawowe zasoby aplikacji w pamięci podręcznej,
  dzięki czemu kalkulator może działać po pierwszym załadowaniu także bez internetu.
*/

const CACHE_NAME = "sag-pwa-v7";

const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(getCachedResponse(request));
});

async function getCachedResponse(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (shouldCache(request, networkResponse)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    if (request.mode === "navigate") {
      return caches.match("./index.html");
    }

    return new Response("Ten zasób nie jest dostępny offline.", {
      status: 503,
      statusText: "Service Unavailable",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

function shouldCache(request, response) {
  const requestUrl = new URL(request.url);

  return (
    requestUrl.origin === self.location.origin
    && response
    && response.ok
    && response.type === "basic"
  );
}
