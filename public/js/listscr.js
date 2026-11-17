/* The List screen: the same places as the map, as a list. It follows the map filters (country, Halal, Favorites, a list from My places, Top rated, Price, Open now, categories ...):
   change a filter on the map and the list changes with it, and the other way round (one shared state: JK.filters).
   Places = the ones loaded for the map view (or all saved places when Favorites / a list is on). Sorting: nearest first, top rated, cheapest first, most expensive first.
   A tap on a row opens that place on the map. Event "jk:screen" = "list" shows it. */
(function () {
  var T = function (k) { return JK.i18n.T(k); }, esc = JK.ui.esc;
  var scr = document.getElementById("listscr"), body = document.getElementById("lbody"), sortEl = document.getElementById("lsort"), lc = document.getElementById("lcats");
  var SORTS = [["near", "Nearest first"], ["top", "Top rated"], ["cheap", "Cheapest first"], ["exp", "Most expensive first"]];
  var sort = (function () { try { var s = JSON.parse(localStorage.getItem("jk_lsort")); if (SORTS.some(function (x) { return x[0] === s; })) return s; } catch (e) {} return "near"; })();
  var shown = 30, tm = 0;
  var km = function (a, b) { var R = 6371, p = Math.PI / 180, dl = (b.lat - a.lat) * p, dn = (b.lng - a.lng) * p, h = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * p) * Math.cos(b.lat * p) * Math.sin(dn / 2) * Math.sin(dn / 2); return 2 * R * Math.asin(Math.sqrt(h)); };
  function center() {
    if (JK.myPos) return JK.myPos; var m = JK.mapObj(); if (m) { var c = m.getCenter(); return { lat: c.lat, lng: c.lng }; }
    try { var v = JSON.parse(localStorage.getItem("jk_view")); if (v && typeof v.lat === "number") return { lat: v.lat, lng: v.lng }; } catch (e) {} return { lat: 35.68, lng: 139.77 };
  }
  var mine = function (id) { return JK.places.mine && JK.places.mine(id); };
  /* light on purpose (old phones): only the MIDDLE of the map view (60 % x 60 %), at most 150 places (the ones nearest the middle), 30 rows drawn at a time */
  var CAP = 150;
  function items() {
    var F = JK.filters, S = F.state, out = [], m = JK.mapObj(), lz = m ? m.getZoom() + 1 : 0, b = m ? m.getBounds() : null;
    var okNw = function (r) { return !r.nw || r.nws !== "wait" || lz >= 16 || mine(r.id); };
    if (S.fav || S.list) JK.lists.places().forEach(function (r) { if (F.savedPass(r) && F.match(r)) out.push(r); });
    else if (b) {
      var dh = (b.getNorth() - b.getSouth()) * .2, dw = (b.getEast() - b.getWest()) * .2, s = b.getSouth() + dh, n = b.getNorth() - dh, w = b.getWest() + dw, e = b.getEast() - dw, L = JK.places.list;
      for (var i = 0; i < L.length; i++) { var r = L[i]; if (r.lat < s || r.lat > n || r.lng < w || r.lng > e) continue; if (F.pass(r) && okNw(r)) out.push(r); }
    }
    if (out.length > CAP) { var c = m ? m.getCenter() : center(); out.sort(function (p, q) { return (Math.pow(p.lat - c.lat, 2) + Math.pow(p.lng - c.lng, 2)) - (Math.pow(q.lat - c.lat, 2) + Math.pow(q.lng - c.lng, 2)); }); out.length = CAP; }
    return out;
  }
  function icon(r) { return JK.ic(JK.pinui.kind(r), 22); }
  function dtext(d) { return T("{0} away").replace("{0}", d < 1 ? Math.max(10, Math.round(d * 100) * 10) + " m" : d.toFixed(1) + " km"); }
  function food(r) { var c = String(r.cuisine || "").split(";")[0].trim().toLowerCase().replace(/_/g, " "); if (!c) return ""; var t = T("c:" + c); return t.indexOf("c:") === 0 ? c : t; }
  function render() {
    if (scr.hidden) return;
    sortEl.innerHTML = SORTS.map(function (s) { return '<button type="button" class="chip' + (sort === s[0] ? " on" : "") + '" data-sort="' + s[0] + '">' + esc(T(s[1])) + "</button>"; }).join("");
    lc.innerHTML = JK.filters.chipsHtml();
    if (sort === "top" || sort === "cheap" || sort === "exp") JK.ratings.all();
    var c = center(), L = items().map(function (r) { return { r: r, d: km(c, r), a: JK.ratings.avg(r.id), p: JK.ratings.price(r.id) }; });
    L.sort(function (x, y) {
      if (sort === "top") { var ax = x.a == null ? -1 : x.a, ay = y.a == null ? -1 : y.a; if (ax !== ay) return ay - ax; }
      else if (sort === "cheap" || sort === "exp") { var px = x.p || 0, py = y.p || 0; if ((px === 0) !== (py === 0)) return px === 0 ? 1 : -1; if (px !== py) return sort === "cheap" ? px - py : py - px; }
      return x.d - y.d;
    });
    var top = L.slice(0, shown); JK.ratings.want(top.map(function (x) { return x.r.id; }));
    var m = JK.mapObj(), far = JK.filters.far(), hint = !m || m.getZoom() + 1 < (far ? 11 : 13), S = JK.filters.state, saved = S.fav || S.list;
    var h = '<p class="lcount">' + L.length + (L.length >= CAP ? "+" : "") + " " + esc(T(L.length === 1 ? "place" : "places")) + "</p>";
    if (!L.length) h += '<p class="lempty">' + esc(!saved && hint ? T("Zoom in closer to see restaurants.") : T("No places match. Try another filter, search, or zoom the map to load more places.")) + "</p>";
    top.forEach(function (x) {
      var r = x.r, f = JK.pinui.flags(r), sub = [food(r)].filter(Boolean).join(" · ");
      h += '<button type="button" class="lr" data-lr="' + esc(r.id) + '"><span class="li">' + icon(r) + '</span><span class="lt"><b>' + esc(JK.places.dname(r)) + "</b><small>" + (sub ? "<span>" + esc(sub) + "</span>" : "") + "<span>" + esc(dtext(x.d)) + "</span>" +
        (f.h ? '<i class="bd">' + JK.ic("halal") + "</i>" : "") + (f.v ? '<i class="bd">' + JK.ic("leaf") + "</i>" : "") + '</small></span><span class="lm">' +
        (x.a != null ? '<span class="lrt">' + JK.ic("star", 14) + x.a.toFixed(1) + "</span>" : "") + (x.p ? "<span>" + esc(JK.price.sym(x.p, r.country)) + "</span>" : "") + "</span></button>";
    });
    if (L.length > shown) h += '<button type="button" class="btn ghost" data-more>' + esc(T("Show 30 more")) + "</button>";
    body.innerHTML = h;
  }
  function soon() { clearTimeout(tm); tm = setTimeout(render, 120); }
  function go(id) {
    var r = JK.places.get(id) || JK.lists.places().filter(function (p) { return p.id === id; })[0]; if (!r) return;
    JK.show("map"); var n = 0;
    (function wait() { var m = JK.mapObj(); if (!m) { if (n++ < 60) setTimeout(wait, 150); return; } m.jumpTo({ center: [r.lng, r.lat], zoom: Math.max(m.getZoom(), 15.5) }); JK.places.add(r); setTimeout(function () { JK.peek.open(r); }, 350); })();
  }
  scr.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.sort) { sort = b.dataset.sort; shown = 30; try { localStorage.setItem("jk_lsort", JSON.stringify(sort)); } catch (x) {} render(); }
    else if (b.dataset.lr) go(b.dataset.lr);
    else if (b.hasAttribute("data-more")) { shown += 30; render(); }
  });
  document.addEventListener("jk:screen", function (e) { if (e.detail === "list") { shown = 30; render(); body.scrollTop = 0; } });
  ["jk:filters", "jk:places", "jk:ratings", "jk:lists", "jk:lang"].forEach(function (ev) { document.addEventListener(ev, function () { if (!scr.hidden) { if (ev === "jk:filters") shown = 30; soon(); } }); });
  JK.list = { render: render };
})();
