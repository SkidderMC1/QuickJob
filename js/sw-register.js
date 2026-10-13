// PWA Service Worker registration.
// Kept as an external file so the Content-Security-Policy can enforce
// `script-src 'self'` without needing 'unsafe-inline'.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        registration.update();
        console.log('[PWA] Service Worker registered and checked for updates:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  });
}
