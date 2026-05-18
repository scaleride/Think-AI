const CACHE_NAME = 'think-ai-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './logo.png',
  './logo_dark.jpg',
  './logo_neon.png',
  './f_logo.jpg',
  './ai_avatar.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
