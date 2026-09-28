const CACHE_NAME = 'glass-party-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apps/nasirglass/index.html',
  './apps/nasirglass/icon-192.png',
  './apps/nasirglass/icon-512.png',
  './apps/ddb/index.html',
  './apps/ddb/icon-192.png',
  './apps/ddb/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // {cache:'reload'} bypasses the browser's own HTTP cache for every one of these
      // fetches, so a version bump always pulls a genuinely fresh copy from the network
      // instead of possibly reusing a stale one the browser had already cached — this is
      // what was letting old app code keep running after a "new" install.
      Promise.all(ASSETS.map((url) =>
        fetch(url, { cache: 'reload' })
          .then((res) => { if (res && res.ok) return cache.put(url, res); })
          .catch(() => {})
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
