const CACHE_NAME = 'cepillos-v41';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './guardian.js',
    './manifest.json',
    './img/pwa_icon.png',
    './img/Fondo-marino 3.jpeg',
    './img/image_34.png.png',
    './img/Muela de fuego-nivel 1.svg',
    './img/Muela de fuego-nivel 2.svg',
    './img/Muela de fuego-nivel 3.svg',
    './img/cropped-colegio-san-ramon-y-san-antonio-logo (2).png'
];

// Install: Pre-cache static assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Fetch: Network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API calls → network-first with offline fallback
    if (url.hostname.includes('script.google.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => response)
                .catch(() => new Response(JSON.stringify({ error: 'offline' }), {
                    headers: { 'Content-Type': 'application/json' }
                }))
        );
        return;
    }

    // Static assets → cache-first
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});

// Activate: Purge old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    return self.clients.claim();
});