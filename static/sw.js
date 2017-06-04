let version = '0.57';

self.addEventListener('install', e => {
  let timeStamp = Date.now();
  e.waitUntil(
    caches.open('kalliope').then(cache => {
      return cache
        .addAll([
          '/',
          '/da/poets/name',
          '/da/poets/year',
          '/static/index.css',
          '/static/register-sw.js',
        ])
        .then(() => self.skipWaiting());
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(response => {
      return response || fetch(event.request);
    })
  );
});
