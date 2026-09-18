const CACHE_NAME = 'codelab-html-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/script.js',
  '/styles.css'
];

// Install: Save the files to Chrome's local storage
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate: Clean up old caches if you update the app later
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch: Intercept requests and serve files from cache if offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // If file is in cache, return it. Otherwise, try the network.
      return cachedResponse || fetch(event.request);
    }).catch(() => {
      // Fallback if network fails completely (like in flight mode)
      return caches.match('/index.html');
    })
  );
});
