// Jakorchi offline helper. Only our own files are kept; Supabase, maps and other sites are never touched.
const V = 'jk-v6', SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/logo.svg'];
const FRESH = ['/css/', '/js/', '/lang/']; // app files: newest from the internet first, saved copy only when offline
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const netFirst = (r, key) => fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(key || r, c)); } return res; }).catch(() => caches.match(key || r));
// the phone keeps at most 250 saved restaurant tiles (about 25 MB); the oldest ones go first
const trim = c => c.keys().then(ks => { const t = ks.filter(k => new URL(k.url).pathname.startsWith('/places/t/')); t.slice(0, Math.max(0, t.length - 250)).forEach(k => c.delete(k)); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') { e.respondWith(netFirst(r, '/')); return; }
  if (FRESH.some(p => u.pathname.startsWith(p)) || u.pathname === '/places/_index.json') { e.respondWith(netFirst(r)); return; } // the tile list is always the newest one
  if (u.pathname.startsWith('/places/')) { // restaurant files: show saved copy at once, refresh in the background
    e.respondWith(caches.open(V).then(async c => {
      const hit = await c.match(r);
      const net = fetch(r).then(res => { if (res.ok) { c.put(r, res.clone()).then(() => trim(c)); } return res; }).catch(() => hit || Response.error());
      return hit || net;
    }));
  }
});
