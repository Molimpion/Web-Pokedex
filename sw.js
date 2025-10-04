const CACHE_NAME = 'pokedex-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-29x29.png',
  './icons/icon-40x40.png',
  './icons/icon-57x57.png',
  './icons/icon-58x58.png',
  './icons/icon-60x60.png',
  './icons/icon-80x80.png',
  './icons/icon-87x87.png',
  './icons/icon-114x114.png',
  './icons/icon-120x120.png',
  './icons/icon-180x180.png',
  './icons/icon-1024x1024.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});