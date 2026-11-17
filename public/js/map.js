/* The map screen: map, "my location", profile circle in the search bar, light/dark map, map language.
   The map starts the first time the map screen opens (the start page stays light and fast). JK.mapObj() = the MapLibre map or null.
   Zoom: up to 21 (classic numbers, MapLibre 20). + / - buttons and a quiet note ("Zoom in closer to see restaurants.") while places are hidden. */
(function () {
  var map = null, box = document.getElementById("map"), prof = document.getElementById("profBtn"), me = null, starting = false, loaded = false, scr = document.getElementById("mapscr");
  var load = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var isDark = function () { var t = document.documentElement.getAttribute("data-theme"); return t ? t === "dark" : window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches; };
  JK.mapObj = function () { return map; };

  /* the quiet note shows while places are hidden (zoomed out; with a filter on, places show from zoom 11) */
  var note = document.getElementById("znote");
  function noteUpdate() { if (map) note.classList.toggle("on", map.getZoom() + 1 < (JK.filters && JK.filters.far() ? 11 : 13)); }
  document.getElementById("zstep").addEventListener("click", function (e) {
    var b = e.target.closest("[data-zs]"); if (!b || !map) return;
    if (b.dataset.zs === "in") map.zoomIn({ duration: 250 }); else map.zoomOut({ duration: 250 });
  });
  document.addEventListener("jk:filters", noteUpdate);
  function create(st) {
    var v = load("jk_view", null); if (!v || typeof v.lat !== "number") v = { lat: 35.6812, lng: 139.7671, z: 12.5 };
    map = new maplibregl.Map({ container: "map", style: st, center: [v.lng, v.lat], zoom: v.z, minZoom: 3, maxZoom: 20, attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, fadeDuration: 100 });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    /* while you pinch or drag nothing is rebuilt; pins, stacks and data wait until the map is calm (smooth, no flicker) */
    map.on("zoom", noteUpdate);
    map.on("moveend", function () {
      noteUpdate(); JK.filters.follow(); setTimeout(function () { JK.places.want(); }, 120); setTimeout(function () { JK.pins.soon(); }, 60);
      var c = map.getCenter(); try { localStorage.setItem("jk_view", JSON.stringify({ lat: +c.lat.toFixed(5), lng: +c.lng.toFixed(5), z: +map.getZoom().toFixed(2) })); } catch (e) {}
    });
    map.on("click", function () { if (JK.peek.current()) JK.peek.close(); });
    map.on("load", function () {
      var at = document.querySelector(".maplibregl-ctrl-attrib"); if (at) { at.classList.remove("maplibregl-compact-show"); at.removeAttribute("open"); }
      loaded = true;
      if (JK.screen === "map") activate(); else if (scr.classList.contains("pre")) { scr.classList.remove("pre"); scr.hidden = true; } /* prepared in the background: ready and waiting */
    });
    if (JK.mapCode() === "ar") { try { maplibregl.setRTLTextPlugin("https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js", true); } catch (e) {} }
  }
  function start() {
    if (map || starting) return; starting = true;
    JK.mapLib().then(function () { return JK.mapStyle(isDark()); }).then(create).catch(function () { starting = false; scr.classList.remove("pre"); if (JK.screen !== "map") scr.hidden = true; else JK.toast(JK.i18n.T("Could not search. Please try again.")); });
  }
  /* the map is shown: load the places, draw the pins */
  function activate() {
    if (!map || !loaded || JK.screen !== "map") return;
    scr.classList.remove("pre"); JK.places.want(); JK.pins.sync(); noteUpdate(); document.documentElement.classList.add("mapok");
  }
  /* A moment after the start page is up, the map is built in the background (invisible, no places loaded yet), so the Map button shows it at once.
     Not on slow / data-saving connections; phones with little memory only get the map library + style ready. */
  function prewarm() {
    if (map || starting || JK.screen === "map" || document.hidden) return;
    var cn = navigator.connection; if (cn && (cn.saveData || /(^|-)2g$/.test(cn.effectiveType || ""))) return;
    if (navigator.deviceMemory && navigator.deviceMemory < 3) { JK.mapLib().then(function () { return JK.mapStyle(isDark()); }).catch(function () {}); return; }
    scr.hidden = false; scr.classList.add("pre"); start();
  }
  setTimeout(function () { (window.requestIdleCallback || function (f) { setTimeout(f, 0); })(prewarm, { timeout: 1500 }); }, 400); /* start page is already painted */
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
      var ll = [p.coords.longitude, p.coords.latitude]; JK.myPos = { lat: p.coords.latitude, lng: p.coords.longitude };
      if (!me) { var e = document.createElement("div"); e.className = "me"; e.setAttribute("aria-label", JK.i18n.T("Your location")); me = new maplibregl.Marker({ element: e }).setLngLat(ll).addTo(map); } else me.setLngLat(ll);
      map.easeTo({ center: ll, zoom: Math.max(map.getZoom(), 15) });
    }, function () {}, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }
  function profile() {
    var inn = JKAuth.signedIn(), u = JK.me ? JK.me.user() : {};
    if (inn) { prof.className = "av prof"; prof.innerHTML = JK.ui.esc(JK.me.initial(u)); prof.setAttribute("data-profile", ""); prof.removeAttribute("data-soon"); prof.setAttribute("aria-label", JK.i18n.T("Profile")); }
    else { prof.className = "prof out"; prof.innerHTML = JK.ic("user", 20); prof.removeAttribute("data-profile"); prof.setAttribute("data-soon", "Sign in"); prof.setAttribute("aria-label", JK.i18n.T("Sign in")); }
  }
  document.getElementById("locBtn").addEventListener("click", locate);
  document.addEventListener("jk:screen", function (e) { if (e.detail === "map") { scr.classList.remove("pre"); start(); if (map) { map.resize(); activate(); setTimeout(function () { map.resize(); JK.pins.soon(); }, 30); } } });
  document.addEventListener("jk:theme", restyle);
  document.addEventListener("jk:lang", function () { labels(); profile(); });
  document.addEventListener("jk:maplet", labels);
  document.addEventListener("jk:auth", profile);
  window.addEventListener("resize", function () { if (map) map.resize(); });
  profile();
})();
