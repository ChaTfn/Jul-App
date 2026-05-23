// Jul'App — Service Worker v1
// Stratégie : cache-first pour les assets, network-first pour les données

const CACHE_NAME = 'julapp-v1';

// Fichiers à mettre en cache au démarrage (shell de l'app)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Installation : mise en cache du shell ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Active immédiatement sans attendre la fermeture des onglets
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
  // Prend le contrôle de tous les onglets ouverts immédiatement
  self.clients.claim();
});

// ── Fetch : cache-first avec fallback réseau ──────────────────────────────
self.addEventListener('fetch', (event) => {
  // On ignore les requêtes non-GET et les extensions Chrome
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Ne cache que les réponses valides
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
          // Fallback hors-ligne : retourne index.html pour les navigations
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
