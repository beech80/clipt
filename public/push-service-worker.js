// Service Worker for Clipt Push Notifications System - Production Version

// Cache name constants
const STATIC_CACHE_NAME = 'clipt-static-v1';
const DYNAMIC_CACHE_NAME = 'clipt-dynamic-v1';

// Resources to cache immediately upon installation
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/icons/icon-512x512.png',
  '/icons/badge-128x128.png',
  '/icons/offline-icon.png'
];

// Installation event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching app shell');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => self.skipWaiting()) // Activate worker immediately
  );
});

// Activation event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => self.clients.claim()) // Take control of clients immediately
  );
  return self.clients.claim();
});

// Handle push notification event
self.addEventListener('push', function(event) {
  try {
    // Try to parse the notification data
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Notification from Clipt';
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icons/icon-512x512.png',
      badge: data.badge || '/icons/badge-128x128.png',
      image: data.image,
      data: {
        url: data.url || '/',
        actionId: data.actionId,
        ...data.data // Spread any additional data
      },
      vibrate: data.vibrate || [100, 50, 100],
      actions: data.actions || [],
      timestamp: data.timestamp || Date.now(),
      tag: data.tag, // For notification grouping
      renotify: data.tag ? true : false, // Vibrate on new notifications even if same tag
      requireInteraction: data.requireInteraction || false // Keep notification visible until user interacts
    };

    // Analytics tracking of received notifications
    const analyticsData = {
      type: 'notification_received',
      title: title,
      topic: data.data?.topic || 'unknown',
      timestamp: Date.now()
    };

    // Send analytics in background
    const analyticsPromise = fetch('/api/analytics/notification-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyticsData)
    }).catch(err => console.error('Failed to log notification analytics:', err));

    // Show the notification
    event.waitUntil(
      Promise.all([
        self.registration.showNotification(title, options),
        analyticsPromise
      ])
    );
  } catch (error) {
    console.error('[Service Worker] Error showing notification:', error);
    // Show a fallback notification in case of error
    event.waitUntil(
      self.registration.showNotification('New Notification', {
        body: 'You have a new notification from Clipt',
        icon: '/icons/icon-512x512.png',
        badge: '/icons/badge-128x128.png'
      })
    );
  }
});

// Handle notification click event with action support and analytics tracking
self.addEventListener('notificationclick', function(event) {
  const notification = event.notification;
  notification.close();

  // Log notification interaction for analytics
  const analyticsData = {
    type: 'notification_clicked',
    title: notification.title,
    timestamp: Date.now(),
    action: event.action || 'default'
  };

  // Determine which URL to open based on the clicked action
  let urlToOpen = notification.data?.url || '/';
  
  // Check if a specific action was clicked
  if (event.action) {
    // Handle specific actions
    switch (event.action) {
      case 'view_profile':
        urlToOpen = notification.data?.profileUrl || '/profile';
        break;
      case 'view_comment':
        urlToOpen = notification.data?.commentUrl || '/comments';
        break;
      case 'view_stream':
        urlToOpen = notification.data?.streamUrl || '/streams';
        break;
      case 'dismiss':
        // Just close the notification without opening any page
        return;
      default:
        // Use the default URL or action-specific URL if available
        urlToOpen = notification.data?.actionUrls?.[event.action] || urlToOpen;
    }
  }
  
  // Track the analytics in the background
  const analyticsPromise = fetch('/api/analytics/notification-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analyticsData)
  }).catch(err => console.error('[Service Worker] Failed to log notification click:', err));

  // Handle the notification click by focusing or opening a window
  event.waitUntil(
    Promise.all([
      // Try to focus an existing window first
      clients.matchAll({type: 'window'}).then(function(clientList) {
        // Check for pathname matches instead of exact URL matches (more flexible)
        const urlObj = new URL(urlToOpen, self.location.origin);
        
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          // If paths match, focus this window
          if (clientUrl.pathname === urlObj.pathname && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no matching window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
      // Track analytics in parallel
      analyticsPromise
    ])
  );
});

// Handle fetch events for offline support
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Network first strategy for dynamic content
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache a clone of the response if it's valid
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If it's an HTML request, serve the offline page
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/offline.html');
            }
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle push subscription change with robust error handling
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker] Push subscription changed');
  
  // Function to get stored auth token
  const getStoredAuthToken = () => {
    return self.registration.scope && 
           caches.open('auth-store').then(cache => 
             cache.match(new Request(`${self.registration.scope}auth-token`))
               .then(response => response ? response.text() : null)
           )
           .catch(err => {
             console.error('[Service Worker] Error retrieving auth token:', err);
             return null;
           });
  };

  event.waitUntil(
    // Try to get stored auth token
    getStoredAuthToken().then(token => {
      // Prepare headers with auth token if available
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Attempt to update subscription in backend
      return fetch('/api/update-push-subscription', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          oldEndpoint: event.oldSubscription?.endpoint,
          subscription: event.newSubscription || self.registration.pushManager.getSubscription()
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to update subscription: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('[Service Worker] Subscription updated successfully:', data);
        return data;
      })
      .catch(error => {
        console.error('[Service Worker] Failed to update subscription:', error);
        
        // If we have a new subscription but the update failed, re-try with a fallback endpoint
        if (event.newSubscription) {
          return fetch('/api/functions/v1/push-subscription-update', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              oldEndpoint: event.oldSubscription?.endpoint,
              subscription: event.newSubscription
            })
          })
          .catch(backupError => {
            console.error('[Service Worker] Backup subscription update failed:', backupError);
          });
        }
      });
    })
  );
});

// Store auth token when it's passed to the service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'STORE_AUTH_TOKEN') {
    // Store token in the cache for secure storage and future use
    event.waitUntil(
      caches.open('auth-store')
        .then(cache => {
          const tokenResponse = new Response(event.data.token);
          return cache.put(new Request(`${self.registration.scope}auth-token`), tokenResponse);
        })
        .then(() => {
          console.log('[Service Worker] Auth token stored successfully');
          // Notify the client that the token was stored
          if (event.source) {
            event.source.postMessage({
              type: 'AUTH_TOKEN_STORED',
              success: true
            });
          }
        })
        .catch(err => {
          console.error('[Service Worker] Failed to store auth token:', err);
          if (event.source) {
            event.source.postMessage({
              type: 'AUTH_TOKEN_STORED',
              success: false,
              error: err.message
            });
          }
        })
    );
  } else if (event.data && event.data.type === 'CLEAR_AUTH_TOKEN') {
    // Clear the token from cache
    event.waitUntil(
      caches.open('auth-store')
        .then(cache => {
          return cache.delete(new Request(`${self.registration.scope}auth-token`));
        })
        .then(() => {
          console.log('[Service Worker] Auth token removed successfully');
          if (event.source) {
            event.source.postMessage({
              type: 'AUTH_TOKEN_CLEARED',
              success: true
            });
          }
        })
        .catch(err => {
          console.error('[Service Worker] Failed to clear auth token:', err);
          if (event.source) {
            event.source.postMessage({
              type: 'AUTH_TOKEN_CLEARED',
              success: false,
              error: err.message
            });
          }
        })
    );
  }
});

// Log any errors that occur in the service worker
self.addEventListener('error', event => {
  console.error('[Service Worker] Uncaught error:', event.filename, event.lineno, event.message);
});

console.log('[Service Worker] Push notification service worker installed and activated');
