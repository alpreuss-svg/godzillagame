/* Service Worker: Spiel offline spielbar machen.
   Bei jedem Update VERSION erhöhen, damit alte Caches gelöscht werden. */
var VERSION = 'kaiju3000-v6';
var ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/raster.js', './js/sprites.js', './js/kaiju3d.js', './js/audio.js', './js/world.js', './js/game.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !font) return;
  // Stale-while-revalidate: sofort aus dem Cache, im Hintergrund aktualisieren
  e.respondWith(caches.open(VERSION).then(function (cache) {
    return cache.match(req, { ignoreSearch: !font }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
