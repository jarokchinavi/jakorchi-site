/* Map library + map style (OpenFreeMap, no key, free).
   JK.mapLib() loads MapLibre (exact file fingerprints, a changed or tampered file is refused) · JK.mapStyle(dark) = style, ready to use.
   Light = the normal OpenFreeMap look. Dark = the same map in dark grey. Labels follow the map language. Saved 7 days. */
(function () {
  var V = "4.7.1", BASE = "https://unpkg.com/maplibre-gl@" + V + "/dist/maplibre-gl.";
  var SRI_JS = "sha384-SYKAG6cglRMN0RVvhNeBY0r3FYKNOJtznwA0v7B5Vp9tr31xAHsZC0DqkQ/pZDmj", SRI_CSS = "sha384-MinO0mNliZ3vwppuPOUnGa+iq619pfMhLVUXfC4LHwSCvF9H+6P/KO4Q7qBOYV5V", libP = null;
  JK.mapLib = function () {
    if (libP) return libP;
    libP = new Promise(function (ok, bad) {
      var c = document.createElement("link"); c.rel = "stylesheet"; c.href = BASE + "css"; c.integrity = SRI_CSS; c.crossOrigin = "anonymous"; document.head.appendChild(c);
      var s = document.createElement("script"); s.src = BASE + "js"; s.integrity = SRI_JS; s.crossOrigin = "anonymous"; s.onload = ok; s.onerror = function () { libP = null; bad(); }; document.head.appendChild(s);
    });
    return libP;
  };

  /* ---- colours: dark map = same map, every colour turned to dark grey ---- */
  function rgba(c) {
    var m; c = String(c).trim();
    if ((m = c.match(/^#([0-9a-f]{3,8})$/i))) { var h = m[1]; if (h.length < 6) h = h.split("").map(function (x) { return x + x; }).join(""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16), h.length >= 8 ? parseInt(h.substr(6, 2), 16) / 255 : 1]; }
    if ((m = c.match(/^rgba?\(([^)]+)\)$/i))) { var p = m[1].split(",").map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    if ((m = c.match(/^hsla?\(([^)]+)\)$/i))) { var q = m[1].split(",").map(parseFloat), h2 = q[0] / 360, s = q[1] / 100, l = q[2] / 100;
      var f = function (n) { var k = (n + h2 * 12) % 12, u = s * Math.min(l, 1 - l); return l - u * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))); };
      return [f(0) * 255, f(8) * 255, f(4) * 255, q.length > 3 ? q[3] : 1]; }
    return null;
  }
  function grey(c, line) {
    var p = rgba(c); if (!p) return c; var L = (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255, v = Math.round(line ? 20 + L * 40 : 18 + (1 - L) * 34);
    return "rgba(" + v + "," + v + "," + v + "," + p[3] + ")";
  }
  function walk(x, line) { if (typeof x === "string") return rgba(x) ? grey(x, line) : x; if (Array.isArray(x)) return x.map(function (y) { return walk(y, line); }); return x; }
  function darken(st) {
    st.layers.forEach(function (l) {
      var p = l.paint || (l.paint = {});
      Object.keys(p).forEach(function (n) { if (/color/.test(n)) p[n] = walk(p[n], l.type === "line"); });
      if (l.id === "background") p["background-color"] = "rgb(18,18,18)";
      if (l.type === "symbol") { p["text-color"] = /^label_/.test(l.id) ? "rgb(238,238,238)" : /^water/.test(l.id) ? "rgb(132,178,226)" : "rgb(204,204,204)"; p["text-halo-color"] = "rgb(12,12,12)"; p["text-halo-width"] = 1.8; }
      if (l["source-layer"] === "building" && l.type === "fill") { p["fill-color"] = "rgb(40,40,43)"; p["fill-outline-color"] = "rgb(52,52,55)"; }
      var o = DARK[l.id]; if (o) Object.keys(o).forEach(function (k) { p[k] = o[k]; });
    });
  }
  /* dark map, clear to read (like the light map): blue water, dark green parks, clearly lighter roads, gold motorways, bright labels */
  var DARK = {
    background: { "background-color": "rgb(20,21,22)" },
    water: { "fill-color": "rgb(17,45,72)" }, waterway: { "line-color": "rgb(34,80,120)" },
    park: { "fill-color": "rgb(22,40,27)" }, landcover_wood: { "fill-color": "rgb(24,42,29)" }, landuse_residential: { "fill-color": "rgb(27,28,29)" },
    highway_path: { "line-color": "rgb(60,60,62)" }, highway_minor: { "line-color": "rgb(76,76,79)" },
    highway_major_casing: { "line-color": "rgb(46,46,48)" }, highway_major_inner: { "line-color": "rgb(112,112,116)" }, highway_major_subtle: { "line-color": "rgba(96,96,100,0.8)" },
    highway_motorway_casing: { "line-color": "rgb(58,50,32)" }, highway_motorway_inner: { "line-color": "rgb(176,148,84)" }, highway_motorway_subtle: { "line-color": "rgba(120,104,62,0.8)" },
    highway_motorway_bridge_casing: { "line-color": "rgb(58,50,32)" }, highway_motorway_bridge_inner: { "line-color": "rgb(176,148,84)" },
    tunnel_motorway_casing: { "line-color": "rgb(48,44,34)" }, tunnel_motorway_inner: { "line-color": "rgb(110,96,60)" },
    railway: { "line-color": "rgb(84,84,88)" }, railway_transit: { "line-color": "rgb(84,84,88)" }, railway_service: { "line-color": "rgb(70,70,74)" },
    railway_dashline: { "line-color": "rgb(20,21,22)" }, railway_transit_dashline: { "line-color": "rgb(20,21,22)" }, railway_service_dashline: { "line-color": "rgb(20,21,22)" },
    road_pier: { "line-color": "rgb(70,70,72)" }, road_area_pier: { "fill-color": "rgb(60,60,62)" }
  };

  /* ---- labels in the map language (jk_maplet: auto | latin | language code) ---- */
  function mapCode() { var v = "auto"; try { v = JSON.parse(localStorage.getItem("jk_maplet")) || "auto"; } catch (e) {} return v === "auto" ? JK.i18n.get() : v === "latin" ? "en" : v; }
  function labelExpr(c) {
    var f = ["get", "name:" + c];
    return (c === "ja" || c === "ko" || c === "zh") ? ["coalesce", f, ["get", "name"]] : ["coalesce", f, ["get", "name_en"], ["get", "name:latin"], ["get", "name"]];
  }
  var isName = function (f) { return f !== undefined && /name/.test(JSON.stringify(f)); };
  JK.mapLabels = function (st) { var e = labelExpr(mapCode()); (st.layers || []).forEach(function (l) { if (l.type === "symbol" && l.layout && isName(l.layout["text-field"])) l.layout["text-field"] = e; }); return st; };
  JK.mapCode = mapCode; JK.labelExpr = function () { return labelExpr(mapCode()); }; JK.isNameField = isName;

  var RASTER = { version: 8, sources: { o: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19, attribution: "&copy; OpenStreetMap contributors" } }, layers: [{ id: "o", type: "raster", source: "o" }] };
  JK.mapStyle = function (dark) {
    var key = dark ? "jk_style2" : "jk_style1", url = "https://tiles.openfreemap.org/styles/" + (dark ? "positron" : "liberty"), got = null;
    try { var c = JSON.parse(localStorage.getItem(key) || "null"); if (c && c.s && Array.isArray(c.s.layers) && Date.now() - c.t < 7 * 864e5) got = Promise.resolve(c.s); } catch (e) {}
    if (!got) got = fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (st) {
      if (st && Array.isArray(st.layers)) { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), s: st })); } catch (e) {} return st; } return null; }).catch(function () { return null; });
    return got.then(function (st) {
      if (!st) return RASTER;
      st = JSON.parse(JSON.stringify(st)); if (dark) darken(st); return JK.mapLabels(st);
    });
  };
})();
