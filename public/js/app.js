/* Jakorchi start: version number, fonts, and the self-reload when a new version is live. */
const BUILD="2026-11-22.7";
window.JK = { build: BUILD, layerOpen: function () { return false; } };

/* iPhone pinch gesture: off on every screen except the map (the map screen will handle its own pinch) */
document.addEventListener("gesturestart", function (e) { if (!document.querySelector(".mapzoom")) e.preventDefault(); });

/* Google Fonts stylesheet loads without blocking the first paint; the intro name shows once the serif font is there (or after 1.2 s by CSS) */
var fnt = function () { document.documentElement.classList.add("fnt"); };
document.querySelectorAll("link[data-font]").forEach(function (l) {
  var on = function () { l.media = "all"; try { document.fonts.load('300 84px "Fraunces"', "Jakorchi").then(fnt, fnt); } catch (e) { fnt(); } };
  l.addEventListener("load", on);
  if (l.sheet) on();
});

/* Intro: only at app start, at least 2 s from the first paint, then a .25 s fade and gone (rules of the old app; CSS hides it after 4 s if this fails) */
(function () {
  var e = document.getElementById("splash"); if (!e) return;
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    setTimeout(function () { e.classList.add("out"); setTimeout(function () { e.remove(); }, 260); }, 2000);
  }); });
})();

/* New version live? Reload once (never while a popup is open, never in a loop). */
function checkVersion() {
  fetch("/version.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (!j || !j.v || j.v === BUILD || window.JK.layerOpen()) return;
    var k = "jk_reloaded_" + j.v;
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch (e) { return; }
    location.reload();
  }).catch(function () {});
}
document.addEventListener("visibilitychange", function () { if (!document.hidden) checkVersion(); });
window.addEventListener("load", function () {
  checkVersion();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function () {});
});
