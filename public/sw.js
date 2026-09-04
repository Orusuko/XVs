// Keeps the staff shell openable when the venue loses signal. Check-in results
// are never cached: those come from the queue in IndexedDB instead.

const CACHE = 'xv-staff-v2';
const BASE = ['/manifest.json', '/icon.svg'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(BASE)));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((clave) => clave !== CACHE).map((clave) => caches.delete(clave))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const solicitud = evento.request;

  if (solicitud.method !== 'GET') return;

  const url = new URL(solicitud.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (!url.pathname.startsWith('/staff/') && !url.pathname.startsWith('/_next/')) return;

  // Network first so staff always get fresh numbers when there is signal,
  // falling back to the last successful response when there is not.
  evento.respondWith(
    fetch(solicitud)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put(solicitud, copia));
        return respuesta;
      })
      .catch(() => caches.match(solicitud)),
  );
});
