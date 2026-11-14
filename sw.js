const CACHE_NAME = 'comet-v3';
const RUNTIME_CACHE = 'comet-runtime-v2';
const ASSETS = [
  './',
  './index.html',
  './offline.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './logo.png',
  './logo_dark.jpg',
  './logo_neon.png',
  './f_logo.jpg',
  './ai_avatar.png',
  './comet_avatar.png',
  './favicon-64.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Add one by one so a single missing file can't break the whole install
      Promise.all(ASSETS.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never touch AI API calls: they need the live network
  if (url.hostname.includes('generativelanguage.googleapis.com')) return;

  // Page loads: network first, then cached app, then the offline page
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req)
            .then((hit) => hit || caches.match('./index.html'))
            .then((hit) => hit || caches.match('./offline.html'))
        )
    );
    return;
  }

  // Your own files: cache first, refresh in the background
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const refresh = fetch(req).then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {}); }
          return res;
        }).catch(() => hit);
        return hit || refresh;
      })
    );
    return;
  }

  // Libraries and fonts from CDNs (Tailwind, icons, fonts): saved on first load so the app also looks right offline
  e.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match(req).then((hit) => {
        const refresh = fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
          return res;
        }).catch(() => hit);
        return hit || refresh;
      })
    )
  );
});

// Focus or open PWA window when a push notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('./');
    })
  );
});
