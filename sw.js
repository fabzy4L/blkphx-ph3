const CACHE_NAME = 'blkphx-v1';
const APP_SHELL  = ['/', '/index.html', '/manifest.json', '/assets/phoenix.svg'];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)))
);

self.addEventListener('activate', e =>
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ))
);

self.addEventListener('fetch', e => {
  if (
    e.request.url.includes('script.google.com') ||
    e.request.url.includes('sheets.googleapis.com')
  ) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
