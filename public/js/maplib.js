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
      if (l.type === "symbol") { p["text-color"] = "rgb(176,176,176)"; p["text-halo-color"] = "rgb(18,18,18)"; p["text-halo-width"] = 1.4; }
      if (l["source-layer"] === "building" && l.type === "fill") { p["fill-color"] = "rgb(36,36,36)"; p["fill-outline-color"] = "rgb(36,36,36)"; }
    });
  }

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
