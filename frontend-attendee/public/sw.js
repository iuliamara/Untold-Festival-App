importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const OFFLINE_CACHE_NAME = 'app-shell-offline-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Precache base app shell on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(OFFLINE_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

if (workbox) {
  console.log('Workbox is loaded successfully.');

  // 1. Cache the App Shell Navigation (falls back to cached index.html if offline)
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    async ({ event }) => {
      const strategy = new workbox.strategies.NetworkFirst({
        cacheName: 'app-shell-navigate',
      });
      try {
        const response = await strategy.handle({ event, request: event.request });
        if (response) {
          const cache = await caches.open(OFFLINE_CACHE_NAME);
          cache.put('/index.html', response.clone());
        }
        return response;
      } catch (error) {
        return caches.match('/index.html') || caches.match('/');
      }
    }
  );

  // 2. Cache Static Assets (CSS, JS, fonts, SVGs, etc.)
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'manifest' ||
      request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'app-shell-assets',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 3. Cache Images (background images, gallery images, stage graphics)
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'images-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 4. Cache API Requests (Network-First strategy)
  // Ensure that tickets, maps, and other core endpoints fallback to cache when Cluj Arena has zero coverage
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.includes('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
} else {
  console.log('Workbox failed to load. Falling back to basic cache-first matching.');
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
}
