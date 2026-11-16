/* Navigate popup: opens the visitor's own maps app with the restaurant as the destination (links only, free, no key; no own navigation).
   Shown by phone: Apple Maps only on Apple devices, "Other map apps" only on Android (the phone's own list of its installed map apps),
   Naver + Kakao for places in Korea, Amap for places in China (their map is shifted, so the position is converted first). Plus Copy address / Copy coordinates.
   JK.navigate.open(place) */
(function () {
  var T = function (k) { return JK.i18n.T(k); }, esc = JK.ui.esc;
  var ua = navigator.userAgent || "", android = /Android/i.test(ua), apple = /iPhone|iPad|iPod|Macintosh/i.test(ua) && !android;
  var sheet = document.querySelector("#navSheet .sheet"), cur = null;
  var mode = (function () { try { var m = JSON.parse(localStorage.getItem("jk_tr")); if (/^(walk|transit|car)$/.test(m)) return m; } catch (e) {} return "walk"; })();
  /* WGS-84 (GPS, our data) -> GCJ-02 (the shifted system China's maps use) */
  function gcj(lat, lng) {
    if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) return [lat, lng];
    var a = 6378245, ee = 0.00669342162296594323;
    var tl = function (x, y) { var r = -100 + 2 * x + 3 * y + .2 * y * y + .1 * x * y + .2 * Math.sqrt(Math.abs(x)); r += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3; r += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3; r += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3; return r; };
    var tn = function (x, y) { var r = 300 + x + 2 * y + .1 * x * x + .1 * x * y + .1 * Math.sqrt(Math.abs(x)); r += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3; r += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3; r += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3; return r; };
    var dLat = tl(lng - 105, lat - 35), dLng = tn(lng - 105, lat - 35), rad = lat / 180 * Math.PI, m = Math.sin(rad); m = 1 - ee * m * m; var sm = Math.sqrt(m);
    dLat = dLat * 180 / ((a * (1 - ee)) / (m * sm) * Math.PI); dLng = dLng * 180 / (a / sm * Math.cos(rad) * Math.PI);
    return [lat + dLat, lng + dLng];
  }
  function links(p) {
    var nm = encodeURIComponent(JK.places.localName(p)), ll = p.lat + "," + p.lng, M = { walk: ["walking", "w", "walk", "walk", "walk"], transit: ["transit", "r", "bus", "public", "PUBLICTRANSIT"], car: ["driving", "d", "car", "car", "car"] }[mode], out = [];
    out.push({ t: "Google Maps", h: "https://www.google.com/maps/dir/?api=1&destination=" + ll + "&travelmode=" + M[0], main: 1 });
    if (apple) out.push({ t: "Apple Maps", h: "https://maps.apple.com/?daddr=" + ll + "&dirflg=" + M[1], main: 1 });
    if (p.country === "Korea") {
      out.push({ t: "Naver Map", h: "nmap://route/" + M[3] + "?dlat=" + p.lat + "&dlng=" + p.lng + "&dname=" + nm + "&appname=jakorchi", web: "https://map.naver.com/p/search/" + nm + "?c=" + p.lng + "," + p.lat + ",17,0,0,0,dh" });
      out.push({ t: "Kakao Map", h: "https://map.kakao.com/link/to/" + nm + "," + ll });
    }
    if (p.country === "China") { var g = gcj(p.lat, p.lng); out.push({ t: "Amap", h: "https://uri.amap.com/navigation?to=" + g[1].toFixed(6) + "," + g[0].toFixed(6) + "," + nm + "&mode=" + M[2] + "&src=jakorchi&callnative=1" }); }
    if (android) out.push({ t: T("Other map apps"), h: "geo:" + ll + "?q=" + ll + "(" + nm + ")", other: 1 });
    return out;
  }
  function copy(text) {
    var done = function () { JK.toast(T("Copied")); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); }); else fallback(text, done);
  }
  function fallback(text, done) { var t = document.createElement("textarea"); t.value = text; t.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) { JK.toast(T("Copy failed.")); } t.remove(); }
  function render() {
    if (!cur) return; var p = cur, co = p.lat.toFixed(5) + ", " + p.lng.toFixed(5);
    var btns = links(p).map(function (l) {
      var ic = l.other ? "grid" : "nav";
      return '<a class="btn' + (l.main ? "" : " ghost") + '" href="' + esc(l.h) + '"' + (l.h.indexOf("http") === 0 ? ' target="_blank" rel="noopener noreferrer"' : "") + (l.web ? ' data-web="' + esc(l.web) + '"' : "") + ">" + JK.ic(ic, 18) + esc(l.t) + "</a>";
    }).join("");
    sheet.innerHTML = '<div class="handle"></div><div class="fhead"><h2>' + esc(T("Navigate")) + '</h2><button type="button" class="round sm" data-sheet-close aria-label="' + esc(T("Close")) + '">' + JK.ic("close", 20) + "</button></div>" +
      '<p class="sn">' + esc(JK.places.dname(p)) + '</p><div class="fh" style="margin-top:0">' + esc(T("Directions by")) + '</div><div class="seg2">' +
      [["walk", "Walk"], ["transit", "Transit"], ["car", "Car"]].map(function (m) { return '<button type="button" data-tr="' + m[0] + '" aria-pressed="' + (mode === m[0]) + '">' + esc(T(m[1])) + "</button>"; }).join("") + "</div>" +
      '<div class="nbtns">' + btns + "</div><div class=\"grp\">" +
      (p.addr ? '<button type="button" class="mi" data-copy="' + esc(p.addr) + '">' + JK.ic("pin", 22) + '<span class="l">' + esc(T("Copy address")) + '<small>' + esc(p.addr) + "</small></span>" + JK.ic("copy", 20) + "</button>" : "") +
      '<button type="button" class="mi" data-copy="' + co + '">' + JK.ic("locate", 22) + '<span class="l">' + esc(T("Copy coordinates")) + "<small>" + co + "</small></span>" + JK.ic("copy", 20) + "</button></div>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button,a"); if (!b || !sheet.contains(b)) return;
    if (b.dataset.tr) { mode = b.dataset.tr; try { localStorage.setItem("jk_tr", JSON.stringify(mode)); } catch (x) {} render(); }
    else if (b.dataset.copy) copy(b.dataset.copy);
    else if (b.dataset.web) { var w = b.dataset.web, t = Date.now(); setTimeout(function () { if (!document.hidden && Date.now() - t < 2500) window.open(w, "_blank", "noopener"); }, 1600); }
  });
  document.addEventListener("jk:lang", function () { if (cur && !document.getElementById("navSheet").hidden) render(); });
  JK.copy = copy;
  JK.navigate = { open: function (p) { cur = p; render(); JK.sheet.open("navSheet"); } };
})();
