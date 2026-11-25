const CACHE_NAME = 'cedi-tracker-v10';

// If the network has not answered after this long, show the saved copy instead
const NETWORK_TIMEOUT = 3000;
// After a timeout the connection is treated as slow for this long, so the rest of the
// page (styles, script) opens straight from the saved copy instead of waiting again
const SLOW_MODE_MS = 60000;
let slowUntil = 0;

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
      cache.addAll(LOCAL_ASSETS.map(url => new Request(url, { cache: 'reload' }))).then(() =>
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

// Network-first with a timeout. Fresh files win when the network answers in time.
// On a slow or dead connection the saved copy is shown after NETWORK_TIMEOUT, and the
// fresh copy is still downloaded in the background for next time.
// Only good (200) responses are saved, so an error page never replaces a working copy.
function networkFirst(event) {
  const request = event.request;
  return new Promise(resolve => {
    let settled = false;
    const finish = response => { if (!settled) { settled = true; resolve(response); } };
    const saved = () => caches.match(request).then(r =>
      r || (request.mode === 'navigate' ? caches.match('./index.html') : null)
    );

    const wait = Date.now() < slowUntil ? 0 : NETWORK_TIMEOUT;
    const timer = setTimeout(() => {
      saved().then(r => {
        if (r) {
          if (wait > 0) slowUntil = Date.now() + SLOW_MODE_MS;
          finish(r);
        }
      });
    }, wait);

    const job = fetch(request).then(response => {
      clearTimeout(timer);
      if (response && response.ok) {
        const copy = response.clone();
        finish(response);
        return caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return saved().then(r => finish(r || response));
    }).catch(() => {
      clearTimeout(timer);
      return saved().then(r => finish(r || Response.error()));
    });

    // Keep the worker alive until the saved copy has been refreshed
    event.waitUntil(job);
  });
}

// Fetch: network-first (with a timeout) for HTML, CSS and JS so updates arrive, cache-first for everything else
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
    event.respondWith(networkFirst(event));
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
