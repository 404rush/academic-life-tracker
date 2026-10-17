// Academic Life Tracker — offline support.  ﹏𓊝﹏ made by Arush Giri
//
// Network first, cache as fallback: when online you always get the latest version (and
// index.html, calendar.js and data.js always come from the same release); when offline,
// or when the network takes more than a few seconds, the cached copy is used instead.
// Google Fonts aren't cached, so offline the app falls back to system fonts.
//
// ► Change VERSION on every release (match the zip, e.g. 'V11' for V11). That installs this worker
//   again, which re-downloads the files below into a fresh cache and deletes the old one.
const VERSION = 'V10';
const CACHE_NAME = `academic-life-tracker-${VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './calendar.js',
  './data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // one missing file shouldn't stop the app from installing
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// cache: 'no-cache' asks the server whether the file changed (a quick check) instead of using
// the browser's HTTP cache — GitHub Pages lets browsers cache files for 10 minutes, which would
// otherwise keep showing the old version for a while after you publish.
// (Page loads are "navigate" requests, which can't be copied with new options, so those are
// re-requested by URL.)
function fetchWithTimeout(req) {
  const fresh = req.mode === 'navigate'
    ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })
    : new Request(req, { cache: 'no-cache' });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS);
    fetch(fresh).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return; // fonts etc. go straight to the network

  event.respondWith(
    fetchWithTimeout(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((cached) => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
        .then((cached) => cached || Response.error()))
  );
});
