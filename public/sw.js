// Service worker mínimo: hace la app instalable. Sin caché (offline es RF-33).
// En F07 recibe las notificaciones push.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
