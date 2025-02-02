const CACHE_NAME = 'clip-cache-v1';
const DATA_CACHE_NAME = 'clip-data-cache-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  OFFLINE_URL,
  '/src/index.css',
  // Add critical app assets
  '/src/components/ui/button.tsx',
  '/src/components/ui/card.tsx'
];

// API routes to cache with network-first strategy
const apiRoutes = [
  '/api/posts',
  '/api/profiles',
  '/api/streams'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(urlsToCache);
      }),
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return cache.addAll(apiRoutes);
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Clear old data caches
      caches.delete(DATA_CACHE_NAME)
    ])
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(async () => {
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline data placeholder
            return new Response(
              JSON.stringify({ error: 'You are offline' }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          });
      })
    );
    return;
  }

  // Handle static assets and navigation
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
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          // Return offline image placeholder
          if (event.request.destination === 'image') {
            return caches.match('/placeholder.svg');
          }
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  } else if (event.tag === 'sync-comments') {
    event.waitUntil(syncComments());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/logo192.png',
    badge: '/favicon.ico',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Content'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Clip', options)
  );
});

// Offline data sync functions
async function syncPosts() {
  const db = await openDB();
  const posts = await db.getAll('offlinePosts');
  
  for (const post of posts) {
    try {
      await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(post)
      });
      await db.delete('offlinePosts', post.id);
    } catch (error) {
      console.error('Failed to sync post:', error);
    }
  }
}

async function syncComments() {
  const db = await openDB();
  const comments = await db.getAll('offlineComments');
  
  for (const comment of comments) {
    try {
      await fetch('/api/comments', {
        method: 'POST',
        body: JSON.stringify(comment)
      });
      await db.delete('offlineComments', comment.id);
    } catch (error) {
      console.error('Failed to sync comment:', error);
    }
  }
}

// IndexedDB helper
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ClipOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offlinePosts')) {
        db.createObjectStore('offlinePosts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offlineComments')) {
        db.createObjectStore('offlineComments', { keyPath: 'id' });
      }
    };
  });
}