/* Jakorchi start: version number, fonts, and the self-reload when a new version is live. */
const BUILD="2026-11-13.1";
window.JK = { build: BUILD, layerOpen: function () { return false; } };

/* Google Fonts stylesheet loads without blocking the first paint */
document.querySelectorAll("link[data-font]").forEach(function (l) {
  var on = function () { l.media = "all"; };
  l.addEventListener("load", on);
  if (l.sheet) on();
});

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
