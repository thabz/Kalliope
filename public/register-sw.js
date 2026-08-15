if ('serviceWorker' in navigator) {
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      registrations.forEach(function(registration) {
        registration.unregister();
      });
    });
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        cacheNames
          .filter(function(cacheName) {
            return cacheName.indexOf('kalliope') === 0;
          })
          .forEach(function(cacheName) {
            caches.delete(cacheName);
          });
      });
    }
  } else {
    navigator.serviceWorker.register('/sw.js', { scope: '/' });
    navigator.serviceWorker.ready.then(function(registration) {
      console.log('Service Worker Ready');
    });
  }
}
