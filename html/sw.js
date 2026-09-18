// sw.js
const CACHE_NAME = 'site-assets-v1';

// Grouping your assets for structural clarity
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/form.html',
  '/preview.html',
  '/styles.css', // Assumed stylesheet if you have one
  '/script.js'
];

const DYNAMIC_PAGES = [
  '/ai.html',
  '/ai.js',
  '/learn.html',
  '/test.html'
];

const ALL_STATIC_ASSETS = [...CORE_ASSETS, ...DYNAMIC_PAGES];

// 1. Install Event: Cache all HTML/JS layout files immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching all structural assets');
      return cache.addAll(ALL_STATIC_ASSETS);
    })
  );
  // Force the waiting service worker to become active immediately
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches if the version updates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Intercept requests intelligently
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // STRATEGY A: Network-First for your JSON data (always get fresh data if online)
  if (url.pathname.endsWith('learn.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response and save a fresh copy to cache
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // If offline, serve the last cached version of the JSON data
          return caches.match(event.request);
        })
    );
  } 
  
  // STRATEGY B: Cache-First for HTML pages and script files
  else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // If it's not in the cache, try the network
        return fetch(event.request).catch(() => {
          // Optional: You could return a custom offline.html page here if a page fails
          console.log('Asset not found in cache and network offline');
        });
      })
    );
  }
});
