/* Which places show on the map, and how (rules from the old app, nothing is drawn all at once):
   - below zoom 13 nothing, except places you saved (always their own marker, from every zoom, never in a cluster)
   - zoom 13-14: a few calm numbered stacks (cell 170 px, then 140 px; at most 8 on a phone, 14 on a big screen, nearest to the middle first, room between them; lone places wait for zoom 15); tap = zoom in 2
   - pins and stacks are only redrawn when the map is calm (moveend), never while you pinch or drag; they fade in and out
   - zoom 15+: single pins, best first (rating, then how much we know), a pin is skipped when it would touch another: at most 18 at zoom 15, 30 at 16, 48 at 17, 70 at 18, 100 at 19
   - only places in view (plus a little margin); the screen is redrawn at most every 200 ms
   Zoom numbers here are the classic ones (MapLibre + 1). JK.pins: sync() · soon() · select(id) */
(function () {
  var markers = {}, clMk = {}, sel = null, selP = null, at = 0, tm = 0;
  var score = function (r) {
    var a = JK.ratings.avg(r.id), s = a != null ? 100 + a * 10 + Math.min(JK.ratings.count(r.id), 10) : 0;
    if (r.cuisine) s += 3; if (r.loc) s += 2; if (r.hours) s += 1; if (r.web) s += 1; if (r.phone) s += 1; return s;
  };
  /* a marker that is no longer needed fades out first (150 ms), then goes; new ones fade in (css) */
  function drop(m) { var e = m.getElement(); e.classList.add("out"); setTimeout(function () { m.remove(); }, 170); }
  function put(store, id, make, sig, ll, anchor, z, onclick) {
    var m = store[id];
    if (m && m._sig === sig) return m;
    if (m) drop(m);
    var e = make(); e.style.zIndex = z;
    m = new maplibregl.Marker({ element: e, anchor: anchor }).setLngLat(ll).addTo(JK.mapObj()); m._sig = sig;
    e.addEventListener("click", function (ev) { ev.stopPropagation(); onclick(); });
    store[id] = m; return m;
  }
  function sync() {
    var map = JK.mapObj(); if (!map || !window.maplibregl) return;
    var mz = map.getZoom(), z = mz + 1, b = map.getBounds(), c = map.getCenter();
    var dw = (b.getEast() - b.getWest()) * .15, dh = (b.getNorth() - b.getSouth()) * .15;
    var w = b.getWest() - dw, e = b.getEast() + dw, s = b.getSouth() - dh, n = b.getNorth() + dh;
    var saved = JK.lists.places(), sv = new Set(saved.map(function (r) { return r.id; }));
    var keepP = {}, keepC = {};
    /* saved places: always */
    saved.forEach(function (r) {
      if (r.lat < s || r.lat > n || r.lng < w || r.lng > e || !JK.filters.savedPass(r)) return;
      var g = JK.lists.glyph(r.id), a = JK.ratings.avg(r.id), isel = sel === r.id, near = z >= 13;
      keepP[r.id] = 1;
      put(markers, r.id, function () { return near ? JK.pinui.pill(r, { glyph: g, rating: a, sel: isel }) : JK.pinui.far(g); }, (near ? "n" : "f") + g + (a != null ? a.toFixed(1) : "") + (isel ? "s" : ""),
        [r.lng, r.lat], near ? "bottom" : "center", isel ? 500 : 400, function () { JK.peek.open(r); });
    });
    var vis = [], cls = [];
    if (z >= JK.filters.minZoom()) { /* a filter on = pins show from further away (zoom 11; Halal / Vegan filter: from zoom 4) */
      var cand = [], L = JK.places.list;
      var team = []; /* places added by the team / confirmed by visitors: always their own pin (never in a stack, no cap) */
      for (var i = 0; i < L.length; i++) { var r = L[i]; if (r.lat < s || r.lat > n || r.lng < w || r.lng > e || sv.has(r.id)) continue; if (JK.filters.pass(r)) { if (r.nw) { if (r.nws !== "wait" || z >= 16 || JK.places.mine(r.id)) team.push(r); } else cand.push(r); } }
      var CL = z < 15, tier = [z < 14 ? 170 : 140, 0]; /* big cells = few, calm stacks */
      var cs = tier[0], W = 256 * Math.pow(2, z);
      var d2 = function (r) { return Math.pow(r.lat - c.lat, 2) + Math.pow(r.lng - c.lng, 2); };
      var key = function (r) { var sn = Math.sin(r.lat * Math.PI / 180), x = (r.lng + 180) / 360 * W, y = (.5 - Math.log((1 + sn) / (1 - sn)) / (4 * Math.PI)) * W; return Math.floor(x / cs) + "," + Math.floor(y / cs); };
      if (JK.filters.active() && JK.filters.total() <= 60) vis = cand;
      else if (CL) {
        var g = new Map();
        cand.forEach(function (r) { var k = key(r), o = g.get(k), f = JK.pinui.flags(r); if (o) { o.n++; o.la += r.lat; o.ln += r.lng; if (f.h) o.h = 1; if (f.v) o.v = 1; } else g.set(k, { n: 1, la: r.lat, ln: r.lng, r: r, h: f.h ? 1 : 0, v: f.v ? 1 : 0 }); });
        var ar = Array.from(g.entries()), CMAX = innerWidth > 700 ? 14 : 8, singles = [];
        if (z < 11 && JK.filters.diet()) CMAX = innerWidth > 700 ? 60 : 30; /* a whole country of halal / vegan places: more stacks, still with room between them */
        /* calm: only a few stacks (8 on a phone, 14 on a big screen), nearest to the middle first, with room between them;
           lone places wait until zoom 15 (only shown when there are hardly any stacks, so the map is never empty) */
        var tc = [];
        ar.map(function (x) { return [Math.pow(x[1].la / x[1].n - c.lat, 2) + Math.pow(x[1].ln / x[1].n - c.lng, 2), x]; }).sort(function (p, q) { return p[0] - q[0]; }).forEach(function (e) {
          var o = e[1][1];
          if (o.n < 2) { singles.push(o.r); return; }
          if (cls.length >= CMAX) return;
          var px = map.project([o.ln / o.n, o.la / o.n]); if (tc.some(function (t) { return Math.abs(t[0] - px.x) < 150 && Math.abs(t[1] - px.y) < 70; })) return; tc.push([px.x, px.y]);
          cls.push([e[1][0], o.la / o.n, o.ln / o.n, o.n, o.h, o.v]);
        });
        if (cls.length < 3) singles.slice(0, 6 - cls.length).forEach(function (r) { vis.push(r); });
        ar = [];
      } else {
        /* like the big map apps: the closer you are, the more you see. The best places first (rating, then how much we know),
           and a pin is only added when it does not touch one that is already there. */
        var cap = z < 16 ? 18 : z < 17 ? 30 : z < 18 ? 48 : z < 19 ? 70 : 100, taken = [];
        var near = function (px) { for (var k = 0; k < taken.length; k++) if (Math.abs(taken[k][0] - px.x) < 84 && Math.abs(taken[k][1] - px.y) < 56) return true; return false; };
        saved.forEach(function (r) { var px = map.project([r.lng, r.lat]); taken.push([px.x, px.y]); });
        if (selP) { var sp = map.project([selP.lng, selP.lat]); taken.push([sp.x, sp.y]); }
        cand.sort(function (a, b) { return score(b) - score(a) || d2(a) - d2(b); });
        for (var q = 0; q < cand.length && vis.length < cap; q++) { var px = map.project([cand[q].lng, cand[q].lat]); if (near(px)) continue; taken.push([px.x, px.y]); vis.push(cand[q]); }
      }
      team.forEach(function (r) { if (vis.indexOf(r) < 0) vis.push(r); });
      vis.forEach(function (r) {
        var a = JK.ratings.avg(r.id), isel = sel === r.id, fl = JK.pinui.flags(r); keepP[r.id] = 1;
        put(markers, r.id, function () { return JK.pinui.pill(r, { rating: a, sel: isel }); }, "p" + (a != null ? a.toFixed(1) : "") + (isel ? "s" : "") + JK.pinui.kind(r) + (fl.h ? "h" : "") + (fl.v ? "v" : ""), [r.lng, r.lat], "bottom", isel ? 500 : 10, function () { JK.peek.open(r); });
      });
      cls.forEach(function (x) {
        var id = Math.round(z) + ":" + x[0]; keepC[id] = 1;
        put(clMk, id, function () { return JK.pinui.cluster(x[3], x[4], x[5]); }, x[3] + "|" + x[4] + "|" + x[5], [x[2], x[1]], "center", 5, function () { map.easeTo({ center: [x[2], x[1]], zoom: Math.min(mz + 2, 16) }); });
      });
      JK.ratings.want(vis.map(function (r) { return r.id; }));
    }
    /* the place you tapped always keeps its (gold) pin, even if the rules would hide it */
    if (selP && !keepP[selP.id] && z >= 13 && selP.lat >= s && selP.lat <= n && selP.lng >= w && selP.lng <= e) {
      var sa = JK.ratings.avg(selP.id); keepP[selP.id] = 1;
      put(markers, selP.id, function () { return JK.pinui.pill(selP, { rating: sa, sel: true, glyph: JK.lists.glyph(selP.id) }); }, 'x' + (sa != null ? sa.toFixed(1) : ''), [selP.lng, selP.lat], 'bottom', 500, function () { JK.peek.open(selP); });
    }
    JK.ratings.want(saved.map(function (r) { return r.id; }));
    Object.keys(markers).forEach(function (id) { if (!keepP[id]) { drop(markers[id]); delete markers[id]; } });
    Object.keys(clMk).forEach(function (id) { if (!keepC[id]) { drop(clMk[id]); delete clMk[id]; } });
    JK.pins.shown = { pins: Object.keys(markers).length, clusters: Object.keys(clMk).length };
  }
  function soon() { clearTimeout(tm); var w = at + 200 - Date.now(); if (w <= 0) { at = Date.now(); sync(); } else tm = setTimeout(function () { at = Date.now(); sync(); }, w); }
  ["jk:places", "jk:ratings", "jk:lists", "jk:filters"].forEach(function (ev) { document.addEventListener(ev, soon); });
  JK.pins = { sync: sync, soon: soon, select: function (id, p) { sel = id; selP = p || null; soon(); }, shown: { pins: 0, clusters: 0 } };
})();
