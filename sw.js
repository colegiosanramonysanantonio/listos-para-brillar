const CACHE_NAME = 'cepillos-v31';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './guardian.js',
    './manifest.json',
    './img/pwa_icon.png',
    './img/Fondo-marino 3.webp',
    './img/image_34.webp',
    './img/Muela de fuego-nivel 1.webp',
    './img/Muela de fuego-nivel 2.webp',
    './img/Muela de fuego-nivel 3.webp',
    './img/cropped-colegio-san-ramon-y-san-antonio-logo (2).png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});