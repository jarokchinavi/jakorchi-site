/* Search: a name, dish, area or food (typos are forgiven, no library). Live while typing (350 ms pause), results from the places loaded on the map.
   A city name (or any place name + Enter) jumps there: the big cities at once, anything else asked at OpenStreetMap Nominatim (answers kept 30 days).
   JK.search: fold(text) · city(text) */
(function () {
  var T = function (k) { return JK.i18n.T(k); }, esc = JK.ui.esc;
  var input = document.getElementById("q"), sugg = document.getElementById("sugg"), tm = 0;
  var CITIES = [["Seoul", 37.5665, 126.978], ["Busan", 35.1796, 129.0756], ["Tokyo", 35.6762, 139.6503], ["Osaka", 34.6937, 135.5023], ["Kyoto", 35.0116, 135.7681], ["Beijing", 39.9042, 116.4074], ["Shanghai", 31.2304, 121.4737], ["Chengdu", 30.5728, 104.0668]];
  /* fold = lower case, no accents, Japanese spelling variants alike (ramen = raamen, shi = si); near = at most m letters wrong */
  var fold = function (s) { return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ou|oo/g, "o").replace(/uu/g, "u").replace(/shi/g, "si").replace(/chi/g, "ti").replace(/tsu/g, "tu").replace(/ji/g, "zi").replace(/fu/g, "hu").replace(/[^\p{L}\p{N}]+/gu, " ").trim(); };
  function near(a, b, m) {
    var x = a.length, y = b.length; if (Math.abs(x - y) > m) return false; var p = [], q = [], o = [];
    for (var j = 0; j <= y; j++) q[j] = j;
    for (var i = 1; i <= x; i++) { o = p; p = q; q = [i]; var lo = i;
      for (j = 1; j <= y; j++) { var v = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, o[j - 2] + 1); q[j] = v; if (v < lo) lo = v; }
      if (lo > m) return false; }
    return q[y] <= m;
  }
  var wHit = function (ws, t) { var m = t.length < 4 ? 0 : t.length < 6 ? 1 : 2; return ws.some(function (w) { return w.indexOf(t) === 0 || (m && (near(w, t, m) || (w.length > t.length && near(w.slice(0, t.length), t, m)))); }); };
  function hit(r, qf, exact) {
    /* the food type counts in every language (ramen = ラーメン = 라멘); rebuilt once the food names have loaded */
    var fl = JK.food && JK.food.loaded();
    if (!r._fw || r._fwl !== fl) { r._fwl = fl; r._fw = fold([r.name, r.loc, r.cuisine, r.addr, fl ? JK.food.cuis(r) : ""].join(" ")).split(" "); }
    return qf.every(function (t) { return exact ? r._fw.some(function (w) { return w.indexOf(t) === 0; }) : wHit(r._fw, t); });
  }
  function find(text) {
    var qf = fold(text).split(" ").filter(Boolean); if (!qf.length) return [];
    var L = JK.places.list, out = [], c = JK.mapObj() ? JK.mapObj().getCenter() : { lat: 35, lng: 135 };
    for (var i = 0; i < L.length; i++) if (hit(L[i], qf, true)) out.push(L[i]);
    if (out.length < 3) for (i = 0; i < L.length; i++) if (out.indexOf(L[i]) < 0 && hit(L[i], qf, false)) { out.push(L[i]); if (out.length > 300) break; }
    var d = function (r) { return Math.pow(r.lat - c.lat, 2) + Math.pow(r.lng - c.lng, 2); };
    return out.sort(function (a, b) { return d(a) - d(b); }).slice(0, 6);
  }
  /* food types that match what is typed (typos are fine): tap one = show only that food on the map */
  function foods(v) { return v.trim().length < 2 || !JK.food ? [] : JK.food.suggest(v, 2); }
  function draw(list, fl) {
    fl = fl || [];
    if (!list.length && !fl.length) { sugg.hidden = true; sugg.innerHTML = ""; return; }
    sugg.innerHTML = fl.map(function (s) { return '<button type="button" class="sg" data-sf="' + s + '"><b>' + esc(JK.food.label(s)) + "</b><small>" + esc(T("Food type")) + "</small></button>"; }).join("") + list.map(function (r, i) { return '<button type="button" class="sg" data-sg="' + i + '"><b>' + esc(JK.places.dname(r)) + "</b><small>" + esc([r.cuisine, r.addr].filter(Boolean).join(" · ")) + "</small></button>"; }).join("");
    sugg.hidden = false; sugg._l = list;
  }
  function go(r) { sugg.hidden = true; input.blur(); var map = JK.mapObj(); if (map) map.easeTo({ center: [r.lng, r.lat], zoom: Math.max(map.getZoom(), 16) }); JK.places.add(r); setTimeout(function () { JK.peek.open(r); }, 350); }
  function fly(lat, lng, z) { var map = JK.mapObj(); if (map) map.easeTo({ center: [lng, lat], zoom: z || 13.5 }); }
  function city(text) {
    text = String(text || "").trim(); if (!text) return;
    var f = fold(text), c = CITIES.filter(function (x) { return fold(x[0]).indexOf(f) === 0 || near(fold(x[0]), f, 1); })[0];
    if (c) { fly(c[1], c[2]); return; }
    var key = "jk_c_city_" + f.slice(0, 40), hitC = null;
    try { hitC = JSON.parse(localStorage.getItem(key) || "null"); } catch (e) {}
    if (hitC && Date.now() - hitC.t < 30 * 864e5) { fly(hitC.lat, hitC.lng); return; }
    JK.toast(T("Searching…"), 4000);
    fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp,kr,cn&accept-language=" + encodeURIComponent(JK.i18n.get()) + "&q=" + encodeURIComponent(text))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (a) {
        if (!a.length) { JK.toast(T("Nothing found.")); return; }
        var lat = +a[0].lat, lng = +a[0].lon; try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), lat: lat, lng: lng })); } catch (e) {}
        fly(lat, lng, 15);
      }).catch(function () { JK.toast(T("Could not search. Please try again.")); });
  }
  input.addEventListener("input", function () { clearTimeout(tm); var v = input.value; if (JK.food) JK.food.ready(); tm = setTimeout(function () { draw(find(v), foods(v)); }, 350); });
  document.addEventListener("jk:foods", function () { if (input.value.trim() && document.activeElement === input) draw(find(input.value), foods(input.value)); });
  input.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return; e.preventDefault(); var l = find(input.value);
    if (l.length) go(l[0]); else city(input.value);
  });
  input.addEventListener("focus", function () { document.documentElement.classList.add("typing"); });
  input.addEventListener("blur", function () { setTimeout(function () { document.documentElement.classList.remove("typing"); }, 150); });
  document.addEventListener("click", function (e) {
    var f = e.target.closest("[data-sf]"); if (f) { sugg.hidden = true; input.value = ""; input.blur(); JK.filters.setFood(f.dataset.sf); return; }
    var b = e.target.closest("[data-sg]"); if (b && sugg._l) { go(sugg._l[+b.dataset.sg]); return; }
    if (!e.target.closest("#sugg") && e.target !== input) sugg.hidden = true;
  });
  JK.search = { fold: fold, near: near, city: city };
})();
