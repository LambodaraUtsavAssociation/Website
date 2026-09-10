const CACHE_VERSION = 'lambodara-v2';
const CACHE_STATIC = `lambodara-static-${CACHE_VERSION}`;
const CACHE_MEDIA = `lambodara-media-${CACHE_VERSION}`;
const CACHE_API = `lambodara-api-${CACHE_VERSION}`;

// Pre-cached critical offline/instant UI assets
const PRECACHE_ASSETS = [
  '/images/village_logo_icon.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/icon-maskable-192.png',
  '/images/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

// Install: pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('SW Precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up obsolete cache versions
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_STATIC, CACHE_MEDIA, CACHE_API];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (!currentCaches.includes(name)) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only intercept GET requests
  if (request.method !== 'GET') return;

  // 2. NEVER cache admin routes, login, dev server HMR, or private APIs
  if (
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/api/admin') ||
    url.pathname.includes('/login') ||
    url.pathname.includes('/_next/webpack-hmr') ||
    url.pathname.includes('sockjs') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // 3. Cache-First: Fonts, Fingerprinted Next.js static assets, Logos & Icons
  if (
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Stale-While-Revalidate: Cloudflare R2 festival media & YouTube thumbnails
  if (
    url.hostname.includes('r2.dev') ||
    url.hostname.includes('img.youtube.com') ||
    url.hostname.includes('i.ytimg.com') ||
    url.pathname.includes('/festival-media/') ||
    url.pathname.includes('/_next/image')
  ) {
    event.respondWith(
      caches.open(CACHE_MEDIA).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          // Return cached response instantly, or await network if not yet cached
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 5. Network-First: Non-admin public GET APIs (e.g. /api/hero-media)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_API).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
});
