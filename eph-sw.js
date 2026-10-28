// Minimal service worker for Ephemeral Room — just enough to make the
// app installable and let the shell load if someone's briefly offline.
// There's nothing meaningful to cache beyond the page itself: actual
// chatting always needs a live connection to the relay server anyway,
// and — fittingly for this app — nothing about the chat itself is
// ever cached or stored here.

const CACHE_NAME = "ephemeral-room-shell-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  // Network-first for the shell files too, so updates to the app
  // itself show up quickly — same reasoning as Adeka Academy Hub's
  // service worker. Falls back to cache only when offline.
  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
