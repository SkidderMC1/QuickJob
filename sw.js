/**
 * EasyJob PWA Service Worker
 * Provides offline support, caching, and instant startup
 */

const CACHE_NAME = 'easyjob-v9';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/design-system.css',
  './css/mobile-chassis.css',
  './css/app.css',
  './js/app.js',
  './js/sw-register.js',
  './js/models/types.js',
  './js/data/mockData.js',
  './js/state/store.js',
  './js/services/authService.js',
  './js/utils/safetyClassifier.js',
  './js/legal/consentManager.js',
  './js/legal/dataSubjectRights.js',
  './js/legal/guardianConsent.js',
  './js/legal/legalDocuments.js',
  './js/legal/legalEngine.js',
  './js/components/devBar.js',
  './js/components/header.js',
  './js/components/nav.js',
  './js/components/jobCard.js',
  './js/components/debugDrawer.js',
  './js/components/consentBanner.js',
  './js/screens/homeScreen.js',
  './js/screens/jobsScreen.js',
  './js/screens/mapScreen.js',
  './js/screens/adminScreen.js',
  './js/screens/jobDetailScreen.js',
  './js/screens/createJobScreen.js',
  './js/screens/messagesScreen.js',
  './js/screens/profileScreen.js',
  './js/screens/authScreen.js',
  './js/screens/safetyModal.js',
  './js/screens/reviewModal.js',
  './js/screens/applicantModal.js',
  './js/screens/reportModal.js',
  './js/screens/legalModal.js',
  './js/screens/guardianModal.js',
  './js/screens/locationModal.js',
  './js/screens/emergencyModal.js',
  './js/screens/receiptModal.js',
  './js/screens/proofPhotoModal.js',
  './js/screens/parentModal.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network First with Cache fallback (ensures latest code is served)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // Only handle same-origin static assets. Never intercept or cache API
  // responses, and ignore cross-origin (non-basic) requests entirely.
  if (requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
