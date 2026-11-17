/* Restaurant data: loads only the map squares you see (places/<x>_<y>.json = one zoom-12 square; from zoom 15 the 16 small squares in places/14/).
   Never loads below zoom 13, never more than 6 squares (9 on a big screen), nearest to the middle first. Places arrive in small portions so the map keeps moving.
   JK.places = { list, get(id), want(), dname(p), localName(p) } · event "jk:places" when new places arrived. Zoom numbers here are the classic ones (MapLibre + 1). */
(function () {
  var Z = 12, SZ = 14, BASE = "/places", doneV = "", split = new Set();
  var byId = new Map(), list = [], done = new Set(), queue = [], busy = false, retry = {}, timer = 0;
  var tx = function (lng, z) { return Math.floor((lng + 180) / 360 * Math.pow(2, z)); };
  var ty = function (lat, z) { var r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z)); };

  var get = function (f) { return fetch(BASE + "/" + f, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
  var ready = Promise.all([get("_done.json"), get("_split.json")]).then(function (a) {
    if (a[0] && Array.isArray(a[0].done) && a[0].done.length) doneV = String(a[0].done.length);
    if (a[1] && Array.isArray(a[1].split)) { split = new Set(a[1].split); doneV += "-" + String(a[1].v || a[1].split.length).replace(/[^\w]/g, ""); }
  });
  function countryOf(lat, lng) { return lng >= 124 && lng <= 131 && lat >= 33 && lat <= 39 ? "Korea" : lng >= 122.9 && lat <= 46 && lat >= 24 && !(lng < 124 && lat > 30) ? "Japan" : "China"; }
  function parse(a) {
    return { id: a[0], name: a[1], loc: a[2] || "", cat: a[3] || "restaurant", cuisine: a[4] || "", lat: a[5], lng: a[6],
      halal: a[7] === 1, halalL: a[7] === 2, vegan: a[8] === 1, veganL: a[8] === 2, veg: a[14] === 1 || a[8] === 1, vegL: a[14] === 2 || a[8] === 2,
      hours: a[9] || "", addr: a[10] || "", web: a[11] || "", country: a[13] || countryOf(a[5], a[6]), phone: a[15] || "", nm: a[16] || null, sub: a[17] || "" };
  }
  function loadSq(x, y, small) {
    return ready.then(function () { return fetch(BASE + "/" + (small ? SZ + "/" : "") + x + "_" + y + ".json" + (doneV ? "?v=" + doneV : "")); })
      .then(function (r) { if (r.status === 404) return 0; if (!r.ok) return null; return r.json().then(function (j) { return j.p; }).catch(function () { return 0; }); })
      .catch(function () { return null; });
  }
  function run() {
    if (busy || !queue.length) return; busy = true;
    var keys = queue.splice(0, queue.length);
    Promise.all(keys.map(function (k) { var p = k.slice(1).split("_").map(Number); return loadSq(p[0], p[1], k[0] === "s"); })).then(async function (res) {
      var add = 0;
      for (var i = 0; i < res.length; i++) {
        var rows = res[i], k = keys[i];
        if (rows === null) { if (!retry[k]) { retry[k] = 1; queue.push(k); } continue; }
        done.add(k);
        for (var j = 0; j < (rows || []).length; j += 1200) {
          rows.slice(j, j + 1200).forEach(function (a) { if (a && !byId.has(a[0])) { var p = parse(a); byId.set(p.id, p); list.push(p); add++; } });
          await new Promise(function (r) { setTimeout(r, 0); });
        }
      }
      busy = false;
      if (add) document.dispatchEvent(new Event("jk:places"));
      if (queue.length) setTimeout(run, 600);
    });
  }
  function want() {
    var map = JK.mapObj(); if (!map) return;
    ready.then(function () {
      var lz = map.getZoom() + 1, far = JK.filters && JK.filters.far(); if (lz >= 11) npLoad(map); if (lz < (far ? 11 : 13)) return; /* a filter on = places load from further away */
      var b = map.getBounds(), c = b.getCenter(); if (c.lat < 18 || c.lat > 54 || c.lng < 73 || c.lng > 146) return;
      var x0 = tx(b.getWest(), Z), x1 = tx(b.getEast(), Z), y0 = ty(b.getNorth(), Z), y1 = ty(b.getSouth(), Z), ts = [];
      for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) ts.push([x, y]);
      var cx = tx(c.lng, Z), cy = ty(c.lat, Z);
      ts.sort(function (p, q) { return (Math.pow(p[0] - cx, 2) + Math.pow(p[1] - cy, 2)) - (Math.pow(q[0] - cx, 2) + Math.pow(q[1] - cy, 2)); });
      ts = ts.slice(0, (far && lz < 13 ? 1.5 : 1) * (innerWidth > 700 ? 9 : 6));
      var add = function (k) { if (!done.has(k) && queue.indexOf(k) < 0) queue.push(k); }, n = 1 << (SZ - Z);
      ts.forEach(function (t) {
        var x = t[0], y = t[1];
        if (lz >= 15 && split.has(x + "_" + y) && !done.has("p" + x + "_" + y)) {
          var a0 = Math.max(tx(b.getWest(), SZ), x * n), a1 = Math.min(tx(b.getEast(), SZ), x * n + n - 1), c0 = Math.max(ty(b.getNorth(), SZ), y * n), c1 = Math.min(ty(b.getSouth(), SZ), y * n + n - 1);
          for (var a = a0; a <= a1; a++) for (var d = c0; d <= c1; d++) add("s" + a + "_" + d);
        } else add("p" + x + "_" + y);
      });
      run();
    });
  }
  /* Places the Jakorchi team added (checked) or that 3 visitors confirmed: a small table in the database (view new_places_public), read only.
     They come on top of the OpenStreetMap squares, have an id np_<number>, always get their own pin, and carry Halal / Vegan from the database.
     Places nobody has checked yet stay hidden until "Add a restaurant" is built. */
  var npBox = null, npAt = 0;
  function npLoad(map) {
    var b = map.getBounds(), s = b.getSouth(), n = b.getNorth(), w = b.getWest(), e = b.getEast();
    if (npBox && s >= npBox[0] && n <= npBox[1] && w >= npBox[2] && e <= npBox[3] && Date.now() - npAt < 300000) return;
    var ps = (n - s) / 2, pw = (e - w) / 2, bx = [s - ps, n + ps, w - pw, e + pw];
    JK.sb.get("new_places_public?select=id,name,lat,lng,cat,cuisine,yes,no,halal,vegan,vegetarian,photo,verified&lat=gte." + bx[0].toFixed(5) + "&lat=lte." + bx[1].toFixed(5) + "&lng=gte." + bx[2].toFixed(5) + "&lng=lte." + bx[3].toFixed(5) + "&order=id.desc&limit=500").then(function (rows) {
      npBox = bx; npAt = Date.now(); var add = 0, CATS = ["restaurant", "coffee", "dessert", "drinks", "fast"];
      (Array.isArray(rows) ? rows : []).forEach(function (x) {
        if (!x || !Number.isInteger(x.id) || !isFinite(x.lat) || !isFinite(x.lng)) return;
        var yes = x.yes | 0, no = x.no | 0, tv = x.verified === true, id = "np_" + x.id, st = tv || (yes >= 3 && yes > no) ? "ok" : "wait", old = byId.get(id);
        if (old) { if (old.nws !== st || old.npy !== yes || old.npn !== no) { old.nws = st; old.npy = yes; old.npn = no; add++; } return; }
        var p = { id: id, name: String(x.name || "").slice(0, 80), loc: "", cat: CATS.indexOf(x.cat) >= 0 ? x.cat : "restaurant", cuisine: /^[a-z &\/()-]{0,40}$/.test(x.cuisine || "") ? x.cuisine : "", lat: +x.lat, lng: +x.lng,
          halal: x.halal === true, halalL: false, vegan: x.vegan === true, veganL: false, veg: x.vegetarian === true || x.vegan === true, vegL: false, hours: "", addr: "", web: "", country: countryOf(+x.lat, +x.lng), phone: "", nm: null, sub: "", nw: 1, npv: tv, nws: st, npy: yes, npn: no, nph: /^[a-z0-9_]{1,60}\/[a-z0-9-]{8,40}\.(jpg|webp)$/.test(x.photo || "") ? x.photo : "" };
        byId.set(id, p); list.push(p); add++;
      });
      if (add) document.dispatchEvent(new Event("jk:places"));
    }).catch(function () {});
  }
  /* names: the name in the app language when we have it, else the real name */
  function dname(p) {
    var l = JK.i18n.get(); if (l === "en") return p.name;
    return (p.nm && p.nm[l]) || ((l === "ja" || l === "ko" || l === "zh") && p.loc) || p.name;
  }
  function localName(p) { return p.loc || p.name; }
  document.addEventListener("jk:filters", function () { JK.places.want(); });
  /* places this phone added (kept on the phone): they show for the person who added them even before 3 phones confirmed */
  var mineSet = function () { try { var a = JSON.parse(localStorage.getItem("jk_npmine")); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  function npForce() { npBox = null; var m = JK.mapObj(); if (m) npLoad(m); }
  JK.places = { countryAt: countryOf, mine: function (id) { return mineSet().indexOf(id) >= 0; }, addMine: function (id) { var a = mineSet(); a.push(id); try { localStorage.setItem("jk_npmine", JSON.stringify(a.slice(-200))); } catch (e) {} }, reloadTeam: npForce, list: list, get: function (id) { return byId.get(id); }, add: function (p) { if (p && !byId.has(p.id)) { byId.set(p.id, p); list.push(p); } }, want: function () { clearTimeout(timer); timer = setTimeout(want, 500); }, dname: dname, localName: localName };
})();
