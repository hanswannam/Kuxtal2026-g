const CACHE_NAME = 'kuxtal-v1';
const STATIC_ASSETS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Kuxtal Travel', body: 'Tienes una nueva notificación', url: '/' };
  try {
    data = event.data.json();
  } catch (e) {
    data.body = event.data ? event.data.text() : data.body;
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kuxtal Travel', {
      body: data.body || data.message || '',
      icon: 'https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif',
      badge: 'https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif',
      data: { url: data.url || data.link || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
