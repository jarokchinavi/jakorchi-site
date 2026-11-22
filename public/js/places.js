/* Restaurant data: adaptive map tiles (tools/pack_places.py). places/_index.json lists every tile {z,x,y,count}; places/t/<z>/<x>_<y>.json holds one tile.
   A quiet region is one big tile, a dense city (Shinjuku) many small ones, so a whole country is only a few hundred to a few thousand files.
   Only tiles that touch the screen are loaded, never below zoom 13 (11 with a filter), nearest to the middle first, until about 45,000 places (90,000 on a big screen).
   Memory: above 60,000 places (120,000 big screen) the tiles that were on screen longest ago are dropped again (trim), so a long visit never fills the phone.
   Places arrive in small portions so the map keeps moving. JK.places = { list, get(id), want(), dname(p), localName(p) } · event "jk:places" when new places arrived. Zoom numbers here are the classic ones (MapLibre + 1). */
(function () {
  var BASE = "/places", idxV = "", idxD = "", leaves = null, idxP = null, dietP = null;
  var byId = new Map(), list = [], done = new Set(), queue = [], busy = false, retry = {}, timer = 0;
  var tileIds = new Map(), usedAt = new Map(), keep = new Set(); /* per tile: its place ids, last time it was on screen; tiles on screen now */
  /* The phone must not fill up: above CAP places in memory the tiles that were on screen longest ago are dropped (saved places and team places are never dropped) */
  var CAP = function () { return JK.placeCap || (innerWidth > 700 ? 120000 : 60000); }; /* JK.placeCap = only for tests */
  function trim() {
    if (list.length <= CAP()) return false;
    var cand = []; tileIds.forEach(function (ids, k) { if (!keep.has(k)) cand.push([usedAt.get(k) || 0, k]); });
    cand.sort(function (a, b) { return a[0] - b[0]; });
    var target = CAP() * 0.75, n = list.length;
    for (var i = 0; i < cand.length && n > target; i++) {
      var k = cand[i][1], ids = tileIds.get(k); ids.forEach(function (id) { byId.delete(id); }); n -= ids.length;
      tileIds.delete(k); usedAt.delete(k); done.delete(k); delete retry[k];
    }
    var rest = list.filter(function (p) { return byId.get(p.id) === p; }); list.length = 0;
    for (var j = 0; j < rest.length; j++) list.push(rest[j]);
    return true;
  }
  var tx = function (lng, z) { return Math.floor((lng + 180) / 360 * Math.pow(2, z)); };
  var fy = function (lat, z) { var r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z); };

  var get = function (f) { return fetch(BASE + "/" + f, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
  /* the tile list; if it cannot be read now, it is asked again at the next move */
  function index() {
    if (!idxP) idxP = get("_index.json").then(function (j) {
      if (!j || !Array.isArray(j.l) || !j.l.length) { idxP = null; return null; }
      idxV = String(j.v || "").replace(/[^\w]/g, ""); idxD = String(j.d || "").replace(/[^\w]/g, "");
      leaves = j.l.filter(function (a) { return Array.isArray(a) && a.length >= 4 && a[0] >= 5 && a[0] <= 16 && a[1] >= 0 && a[2] >= 0 && a[3] > 0; })
        .map(function (a) { return { z: a[0] | 0, x: a[1] | 0, y: a[2] | 0, n: a[3] | 0, k: (a[0] | 0) + "/" + (a[1] | 0) + "_" + (a[2] | 0) }; });
      return leaves;
    });
    return idxP;
  }
  function countryOf(lat, lng) { return lng >= 124 && lng <= 131 && lat >= 33 && lat <= 39 ? "Korea" : lng >= 122.9 && lat <= 46 && lat >= 24 && !(lng < 124 && lat > 30) ? "Japan" : "China"; }
  function parse(a) {
    return { id: a[0], name: a[1], loc: a[2] || "", cat: a[3] || "restaurant", cuisine: a[4] || "", lat: a[5], lng: a[6],
      halal: a[7] === 1, halalL: a[7] === 2, vegan: a[8] === 1, veganL: a[8] === 2, veg: a[14] === 1 || a[8] === 1, vegL: a[14] === 2 || a[8] === 2,
      hours: a[9] || "", addr: a[10] || "", web: a[11] || "", country: a[13] || countryOf(a[5], a[6]), phone: a[15] || "", nm: a[16] || null, sub: a[17] || "" };
  }
  /* Halal / Vegan filter on: ALL halal, some-halal, vegan and vegetarian places of every country (places/diet.json, ~2,000 rows) + the team's / visitors' ones,
     loaded once, so they can be shown from far away. Same rows are skipped later when their normal tile loads. */
  function loadDiet() {
    if (dietP) return dietP;
    dietP = index().then(function (L) {
      if (!L) { dietP = null; return; }
      return fetch(BASE + "/diet.json" + (idxD ? "?v=" + idxD : "")).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (j) {
        var add = 0; (j.p || []).forEach(function (a) { if (a && !byId.has(a[0])) { var p = parse(a); byId.set(p.id, p); list.push(p); add++; } });
        npDiet(); if (add) document.dispatchEvent(new Event("jk:places"));
      });
    }).catch(function () { dietP = null; });
    return dietP;
  }
  function loadSq(k) {
    return fetch(BASE + "/t/" + k + ".json" + (idxV ? "?v=" + idxV : ""))
      .then(function (r) { if (r.status === 404) return 0; if (!r.ok) return null; return r.json().then(function (j) { return j.p; }).catch(function () { return 0; }); })
      .catch(function () { return null; });
  }
  function run() {
    if (busy || !queue.length) return; busy = true;
    var keys = queue.splice(0, queue.length);
    Promise.all(keys.map(loadSq)).then(async function (res) {
      var add = 0;
      for (var i = 0; i < res.length; i++) {
        var rows = res[i], k = keys[i];
        if (rows === null) { if (!retry[k]) { retry[k] = 1; queue.push(k); } continue; }
        done.add(k); var ids = [];
        for (var j = 0; j < (rows || []).length; j += 1200) {
          rows.slice(j, j + 1200).forEach(function (a) { if (a && !byId.has(a[0])) { var p = parse(a); byId.set(p.id, p); list.push(p); ids.push(p.id); add++; } });
          await new Promise(function (r) { setTimeout(r, 0); });
        }
        tileIds.set(k, ids);
      }
      var dropped = trim();
      busy = false;
      if (add || dropped) document.dispatchEvent(new Event("jk:places"));
      if (queue.length) setTimeout(run, 600);
    });
  }
  function want() {
    var map = JK.mapObj(); if (!map) return;
    var lz = map.getZoom() + 1, far = JK.filters && JK.filters.far(); if (lz >= 11) npLoad(map);
    if (JK.filters && JK.filters.diet()) loadDiet(); /* Halal / Vegan filter: all of those places, from any zoom */
    if (lz < (far ? 11 : 13)) return; /* a filter on = tiles load from further away */
    var b = map.getBounds(), c = b.getCenter(); if (c.lat < 18 || c.lat > 54 || c.lng < 73 || c.lng > 146) return;
    index().then(function (L) {
      if (!L) return;
      var W = b.getWest(), E = b.getEast(), N = b.getNorth(), S = b.getSouth(), rg = {}, hit = [];
      L.forEach(function (l) { /* tiles that touch the screen, with their distance (in zoom-12 squares) to the middle */
        var r = rg[l.z] || (rg[l.z] = [tx(W, l.z), tx(E, l.z), Math.floor(fy(N, l.z)), Math.floor(fy(S, l.z)), (c.lng + 180) / 360 * Math.pow(2, l.z), fy(c.lat, l.z)]);
        if (l.x < r[0] || l.x > r[1] || l.y < r[2] || l.y > r[3]) return;
        var dx = Math.max(l.x - r[4], 0, r[4] - l.x - 1), dy = Math.max(l.y - r[5], 0, r[5] - l.y - 1), s = Math.pow(2, l.z - 12);
        hit.push([(dx * dx + dy * dy) / (s * s), l]);
      });
      hit.sort(function (p, q) { return p[0] - q[0]; });
      var budget = (far && lz < 13 ? 1.5 : 1) * (innerWidth > 700 ? 90000 : 45000), used = 0, now = Date.now(); keep = new Set();
      for (var i = 0; i < hit.length; i++) {
        var l = hit[i][1]; if (i && used + l.n > budget) break; used += l.n;
        keep.add(l.k); usedAt.set(l.k, now);
        if (!done.has(l.k) && queue.indexOf(l.k) < 0) queue.push(l.k);
      }
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
      npBox = bx; npAt = Date.now(); npIn(rows);
    }).catch(function () {});
  }
  /* the team's / visitors' halal and vegan places of the whole world (a few rows): for the Halal / Vegan filter seen from far away */
  function npDiet() {
    JK.sb.get("new_places_public?select=id,name,lat,lng,cat,cuisine,yes,no,halal,vegan,vegetarian,photo,verified&or=(halal.eq.true,vegan.eq.true,vegetarian.eq.true)&order=id.desc&limit=500").then(npIn).catch(function () {});
  }
  function npIn(rows) {
    var add = 0, CATS = ["restaurant", "coffee", "dessert", "drinks", "fast"];
    (Array.isArray(rows) ? rows : []).forEach(function (x) {
      if (!x || !Number.isInteger(x.id) || !isFinite(x.lat) || !isFinite(x.lng)) return;
      var yes = x.yes | 0, no = x.no | 0, tv = x.verified === true, id = "np_" + x.id, st = tv || (yes >= 3 && yes > no) ? "ok" : "wait", old = byId.get(id);
      if (old) { if (old.nws !== st || old.npy !== yes || old.npn !== no) { old.nws = st; old.npy = yes; old.npn = no; add++; } return; }
      var p = { id: id, name: String(x.name || "").slice(0, 80), loc: "", cat: CATS.indexOf(x.cat) >= 0 ? x.cat : "restaurant", cuisine: /^[a-z &\/()-]{0,40}$/.test(x.cuisine || "") ? x.cuisine : "", lat: +x.lat, lng: +x.lng,
        halal: x.halal === true, halalL: false, vegan: x.vegan === true, veganL: false, veg: x.vegetarian === true || x.vegan === true, vegL: false, hours: "", addr: "", web: "", country: countryOf(+x.lat, +x.lng), phone: "", nm: null, sub: "", nw: 1, npv: tv, nws: st, npy: yes, npn: no, nph: /^[a-z0-9_]{1,60}\/[a-z0-9-]{8,40}\.(jpg|webp)$/.test(x.photo || "") ? x.photo : "" };
      byId.set(id, p); list.push(p); add++;
    });
    if (add) document.dispatchEvent(new Event("jk:places"));
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
