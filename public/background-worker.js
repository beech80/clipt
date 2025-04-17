// Background Service Worker for Clipt
// Handles background processing tasks

const CACHE_NAME = 'clipt-cache-v1';

// Assets to cache for offline access
const assetsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Background worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(assetsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Background worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, then network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response - one to cache, one to return
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-profile-updates') {
    event.waitUntil(syncProfileUpdates());
  }
});

// Process message queue in background
async function syncMessages() {
  try {
    const messageQueue = await getMessageQueue();
    
    for (const message of messageQueue) {
      try {
        await sendMessage(message);
        await removeFromQueue(message.id);
      } catch (error) {
        console.error('Failed to sync message:', error);
        // Will retry on next sync
      }
    }
  } catch (error) {
    console.error('Error syncing messages:', error);
  }
}

// Process profile updates in background
async function syncProfileUpdates() {
  try {
    const updateQueue = await getProfileUpdateQueue();
    
    for (const update of updateQueue) {
      try {
        await updateProfile(update);
        await removeFromUpdateQueue(update.id);
      } catch (error) {
        console.error('Failed to sync profile update:', error);
        // Will retry on next sync
      }
    }
  } catch (error) {
    console.error('Error syncing profile updates:', error);
  }
}

// These functions would connect to IndexedDB in a real implementation
// For this demo, they're just placeholders
async function getMessageQueue() {
  return [];
}

async function sendMessage(message) {
  // Would send message to server
}

async function removeFromQueue(messageId) {
  // Would remove from IndexedDB
}

async function getProfileUpdateQueue() {
  return [];
}

async function updateProfile(update) {
  // Would update profile on server
}

async function removeFromUpdateQueue(updateId) {
  // Would remove from IndexedDB
}

// Listen for push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const notificationData = event.data.json();
    
    const options = {
      body: notificationData.body,
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        url: notificationData.url
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(notificationData.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.matchAll({type: 'window'})
        .then(windowClients => {
          // Check if there's already an open window
          for (const client of windowClients) {
            if (client.url === event.notification.data.url && 'focus' in client) {
              return client.focus();
            }
          }
          
          // If not, open a new window
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url);
          }
        })
    );
  }
});

console.log('Background worker loaded successfully');
