const CACHE_NAME = 'cedi-tracker-v9';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

const OPTIONAL_ASSETS = [
  './icon-192.png',
  './icon-512.png'
];

const EXTERNAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&display=swap'
];

// Install: cache local files (must succeed) and external files (best effort)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(LOCAL_ASSETS).then(() =>
        Promise.all(
          OPTIONAL_ASSETS.map(url => cache.add(url).catch(() => {})).concat(EXTERNAL_ASSETS.map(url =>
            fetch(url, { mode: 'no-cors' })
              .then(res => cache.put(url, res))
              .catch(() => {})
          ))
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key.startsWith('cedi-tracker-') && key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML, CSS and JS (so updates arrive), cache-first for everything else
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Only cache this app's own files and the Excel library and fonts. Never cache exchange-rate calls.
  const url = new URL(event.request.url);
  const mine = url.origin === self.location.origin;
  const allowed = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname);
  if (!mine && !allowed) return;

  const isHTML =
    (mine && /\.(js|css)$/.test(url.pathname)) ||
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
  }
});

// Tapping a notification opens or focuses the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow('./index.html');
    })
  );
});
