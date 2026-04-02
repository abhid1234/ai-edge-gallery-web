const CACHE_NAME = 'ai-gallery-v6';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip model downloads and HuggingFace
  if (event.request.url.includes('r2.dev/models/') ||
      event.request.url.includes('huggingface.co')) {
    return;
  }

  // Network-first for HTML and JS (ensures new deploys work immediately)
  // Cache-first only for static assets (fonts, images)
  const isAsset = event.request.url.includes('/assets/') &&
    (event.request.url.endsWith('.css') || event.request.url.endsWith('.woff2') || event.request.url.endsWith('.png'));

  if (isAsset) {
    // Cache-first for immutable assets (Vite hashes them)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  } else {
    // Network-first for everything else (HTML, JS bundles, JSON)
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
  }
});
