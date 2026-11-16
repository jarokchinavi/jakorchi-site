/* Which screen shows: the start page (#home) or the map (#mapscr). Pages (settings, profile) hide the screen and bring it back.
   JK.show("home"|"map") · JK.hideScreens() / JK.showScreen() · JK.toast(text) */
(function () {
  var els = { home: document.getElementById("home"), map: document.getElementById("mapscr") };
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
  JK.hideScreens = function () { Object.keys(els).forEach(function (k) { els[k].hidden = true; }); };
  JK.showScreen = function () { JK.show(JK.screen); };
  JK.toast = function (t, ms) { toast.textContent = t; toast.hidden = false; clearTimeout(tt); tt = setTimeout(function () { toast.hidden = true; }, ms || 2600); };
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b) JK.show(b.dataset.go); });
})();
