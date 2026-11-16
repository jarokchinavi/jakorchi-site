/* The map screen: map, zoom ring, "my location", profile circle in the search bar, light/dark map, map language.
   The map starts the first time the map screen opens (the start page stays light and fast). JK.mapObj() = the MapLibre map or null.
   Zoom: up to 21 (classic numbers, MapLibre 20). Below zoom 13 the zoom ring shows; tap it to zoom in. */
(function () {
  var map = null, box = document.getElementById("map"), ring = document.getElementById("zring"), prof = document.getElementById("profBtn"), me = null, starting = false;
  var load = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var isDark = function () { var t = document.documentElement.getAttribute("data-theme"); return t ? t === "dark" : window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches; };
  JK.mapObj = function () { return map; };

  function ringUpdate() { ring.hidden = !map || map.getZoom() + 1 >= 13; }
  function create(st) {
    var v = load("jk_view", null); if (!v || typeof v.lat !== "number") v = { lat: 35.6812, lng: 139.7671, z: 12.5 };
    map = new maplibregl.Map({ container: "map", style: st, center: [v.lng, v.lat], zoom: v.z, minZoom: 3, maxZoom: 20, attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, fadeDuration: 100 });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.on("move", function () { JK.pins.soon(); ringUpdate(); });
    map.on("moveend", function () {
      JK.places.want(); JK.pins.soon(); ringUpdate();
      var c = map.getCenter(); try { localStorage.setItem("jk_view", JSON.stringify({ lat: +c.lat.toFixed(5), lng: +c.lng.toFixed(5), z: +map.getZoom().toFixed(2) })); } catch (e) {}
    });
    map.on("click", function () { if (JK.peek.current()) JK.peek.close(); });
    map.on("load", function () { var at = document.querySelector(".maplibregl-ctrl-attrib"); if (at) { at.classList.remove("maplibregl-compact-show"); at.removeAttribute("open"); } JK.places.want(); JK.pins.sync(); ringUpdate(); document.documentElement.classList.add("mapok"); });
    if (JK.mapCode() === "ar") { try { maplibregl.setRTLTextPlugin("https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js", true); } catch (e) {} }
  }
  function start() {
    if (map || starting) return; starting = true;
    JK.mapLib().then(function () { return JK.mapStyle(isDark()); }).then(create).catch(function () { starting = false; JK.toast(JK.i18n.T("Could not search. Please try again.")); });
  }
  function restyle() { if (map) JK.mapStyle(isDark()).then(function (st) { map.setStyle(st, { diff: false }); }); }
  function labels() {
    if (!map || !map.getStyle()) return; var e = JK.labelExpr();
    map.getStyle().layers.forEach(function (l) { if (l.type === "symbol" && l.layout && JK.isNameField(l.layout["text-field"])) { try { map.setLayoutProperty(l.id, "text-field", e); } catch (x) {} } });
  }
  /* my location: a green dot with a cream ring */
  function locate() {
    if (!navigator.geolocation || !map) return;
    JK.toast(JK.i18n.T("Finding your location…"), 4000);
    navigator.geolocation.getCurrentPosition(function (p) {
      var ll = [p.coords.longitude, p.coords.latitude];
      if (!me) { var e = document.createElement("div"); e.className = "me"; e.setAttribute("aria-label", JK.i18n.T("Your location")); me = new maplibregl.Marker({ element: e }).setLngLat(ll).addTo(map); } else me.setLngLat(ll);
      map.easeTo({ center: ll, zoom: Math.max(map.getZoom(), 15) });
    }, function () {}, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }
  function profile() {
    var inn = JKAuth.signedIn(), u = JK.me ? JK.me.user() : {};
    if (inn) { prof.className = "av prof"; prof.innerHTML = JK.ui.esc(JK.me.initial(u)); prof.setAttribute("data-profile", ""); prof.removeAttribute("data-soon"); prof.setAttribute("aria-label", JK.i18n.T("Profile")); }
    else { prof.className = "prof out"; prof.innerHTML = JK.ic("user", 20); prof.removeAttribute("data-profile"); prof.setAttribute("data-soon", "Sign in"); prof.setAttribute("aria-label", JK.i18n.T("Sign in")); }
  }
  ring.addEventListener("click", function () { if (map) map.easeTo({ zoom: map.getZoom() + 2 }); });
  document.getElementById("locBtn").addEventListener("click", locate);
  document.addEventListener("jk:screen", function (e) { if (e.detail === "map") { start(); if (map) setTimeout(function () { map.resize(); JK.pins.soon(); }, 30); } });
  document.addEventListener("jk:theme", restyle);
  document.addEventListener("jk:lang", function () { labels(); profile(); });
  document.addEventListener("jk:maplet", labels);
  document.addEventListener("jk:auth", profile);
  window.addEventListener("resize", function () { if (map) map.resize(); });
  profile();
})();
