const CACHE_NAME = 'kuxtal-v5';
const STATIC_ASSETS = ['/', '/manifest.json', '/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png'];
const API_CACHE = 'kuxtal-api-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip caching for API auth endpoints and push
  if (url.pathname.includes('/api/auth/') || url.pathname.includes('/api/push/')) return;

  // Stale-while-revalidate for API GET requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first for JS/CSS (prevents stale bundles after deploy causing runtime errors)
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets (images, fonts only)
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|woff2?)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first for HTML navigation
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Kuxtal Travel', body: 'Tienes una nueva notificación', url: '/' };
  try {
    data = event.data.json();
  } catch (e) {
    data.body = event.data ? event.data.text() : data.body;
  }
  const options = {
    body: data.body || data.message || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    data: { url: data.url || data.link || '/' },
    vibrate: [200, 100, 200],
    tag: data.tag || 'kuxtal-notif',
    renotify: true,
    requireInteraction: false,
    actions: [{ action: 'open', title: 'Ver' }]
  };
  if (data.image) {
    options.image = data.image;
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kuxtal Travel', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      // Focus existing window if any
      for (const client of windows) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
