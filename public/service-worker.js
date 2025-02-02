const CACHE_NAME = 'clip-cache-v1';
const DATA_CACHE_NAME = 'clip-data-cache-v1';

// Assets to cache immediately
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/offline.html'
];

// Create a separate cache for API responses
const apiCacheUrls = [
  '/posts',
  '/profiles',
  '/comments'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(urlsToCache);
      }),
      // Cache API endpoints
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return cache.addAll(apiCacheUrls);
      })
    ])
  );
  // Force service worker to become active
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages under this service worker's scope
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Handle API requests
  if (event.request.url.includes('/rest/v1/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          // Return offline image for image requests
          if (event.request.destination === 'image') {
            return caches.match('/placeholder.svg');
          }
          return new Response('Offline content not available');
        });
    })
  );
});

// Handle background sync for failed post requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'post-sync') {
    event.waitUntil(
      // Attempt to resend failed posts
      syncPosts()
    );
  }
});

// Listen for push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/logo192.png',
    badge: '/favicon.ico'
  };

  event.waitUntil(
    self.registration.showNotification('Clip', options)
  );
});