if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

navigator.serviceWorker.ready.then(function(registration) {
  console.log('Service Worker Ready');
});
