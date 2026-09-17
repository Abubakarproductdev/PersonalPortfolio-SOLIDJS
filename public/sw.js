const CACHE_NAME = "portfolio-assets-v2";
const FRAME_COUNT = 192;
const frameUrl = (index) => `/frames/${String(index).padStart(5, "0")}_compressed.webp`;

const CORE_ASSETS = [
  "/",
  "/frames/00001_compressed.webp",
  "/sivo.webp",
  "/agri.webp",
  "/stra.webp",
  "/startup.webp",
  "/e.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isCacheableAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/frames/") ||
      url.pathname.startsWith("/assets/") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".webp") ||
      url.pathname.endsWith(".hdr"));

  if (!isCacheableAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_FRAMES") return;

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (let index = 1; index <= FRAME_COUNT; index += 1) {
        const url = frameUrl(index);
        const cached = await cache.match(url);
        if (!cached) {
          await cache.add(url).catch(() => undefined);
        }
      }
    }),
  );
});
