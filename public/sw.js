// Jakorchi offline helper. Only our own files are kept; Supabase, maps and other sites are never touched.
const V = 'jk-v5', SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/logo.svg'];
const FRESH = ['/css/', '/js/', '/lang/']; // app files: newest from the internet first, saved copy only when offline
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const netFirst = (r, key) => fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(key || r, c)); } return res; }).catch(() => caches.match(key || r));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') { e.respondWith(netFirst(r, '/')); return; }
  if (FRESH.some(p => u.pathname.startsWith(p))) { e.respondWith(netFirst(r)); return; }
  if (u.pathname.startsWith('/places/')) { // restaurant files: show saved copy at once, refresh in the background
    e.respondWith(caches.open(V).then(async c => {
      const hit = await c.match(r);
      const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit || Response.error());
      return hit || net;
    }));
  }
});
