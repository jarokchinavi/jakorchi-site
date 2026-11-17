/* Which screen shows: the start page (#home) or the map (#mapscr). Pages (settings, profile) hide the screen and bring it back.
   JK.show("home"|"map") · JK.hideScreens() / JK.showScreen() · JK.toast(text) */
(function () {
  var els = { home: document.getElementById("home"), map: document.getElementById("mapscr"), list: document.getElementById("listscr") };
  var toast = document.getElementById("toast"), tt = 0;
  JK.screen = "home";
  JK.show = function (n) {
    if (!els[n]) n = "home";
    JK.screen = n;
    Object.keys(els).forEach(function (k) { els[k].hidden = k !== n; });
    document.documentElement.classList.toggle("onmap", n === "map"); els.map.classList.toggle("mapzoom", n === "map");
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("jk:screen", { detail: n }));
  };
  /* pages (settings, profile) scroll like normal pages: the map's "no page scroll" lock is lifted while they show (JK.showScreen puts it back) */
  JK.hideScreens = function () { Object.keys(els).forEach(function (k) { els[k].hidden = true; }); document.documentElement.classList.remove("onmap"); };
  JK.showScreen = function () { JK.show(JK.screen); };
  JK.toast = function (t, ms) { toast.textContent = t; toast.hidden = false; clearTimeout(tt); tt = setTimeout(function () { toast.hidden = true; }, ms || 2600); };
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b) JK.show(b.dataset.go); });
  /* swipe the bottom bar (Start | Map | List): right to left = the next one, left to right = the one before (same as tapping it) */
  var sw = null;
  document.addEventListener("touchstart", function (e) { var n = e.touches.length === 1 && e.target.closest("nav.seg"); sw = n ? { n: n, x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (!sw) return; var d = sw, t = e.changedTouches[0], dx = t.clientX - d.x, dy = t.clientY - d.y; sw = null;
    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    var bs = d.n.querySelectorAll("button"), nb = bs[({ home: 0, map: 1, list: 2 }[JK.screen] || 0) + (dx < 0 ? 1 : -1)];
    if (nb) nb.click();
  });
})();
