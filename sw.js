// CCST Trainer — offline service worker
// Bump CACHE when you upload a new index.html so devices pick up the change.
const CACHE = 'ccst-trainer-v13';
// Cache both names so it works whether you ship as index.html or command-protocol-trainer.html.
const ASSETS = ['./', './index.html', './field-technician-trainer.html', './icon.png', './manifest.json'];

self.addEventListener('install', e => {
  // addAll() rejects the whole batch if any single asset 404s, which would leave
  // nothing cached and silently break offline. Cache each asset independently instead.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: serve cache instantly (works offline),
// refresh in the background so the next open has any updates.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
