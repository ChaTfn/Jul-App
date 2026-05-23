// Jul'App — Service Worker v1
// Stratégie : cache-first pour les assets, network-first pour les données

const CACHE_NAME = 'julapp-v1';

const PRECACHE_ASSETS = [
  '/Jul-App/',
  '/Jul-App/index.html',
  '/Jul-App/manifest.json',
  '/Jul-App/icons/apple-touch-icon.png',
  '/Jul-App/icons/icon-192.png',
  '/Jul-App/icons/icon-512.png',
];

// ── Installation : mise en cache du shell ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activation : suppression des anciens caches ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : cache-first avec fallback réseau ──────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, toCache);
          });
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/Jul-App/index.html');
          }
        });
    })
  );
});
