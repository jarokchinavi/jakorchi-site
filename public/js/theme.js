/* Runs before the page is drawn, so there is no flash of the wrong colours. Saved as "jk_theme" (same key as before). */
(function () {
  var COLORS = { light: "#F6F1E6", dark: "#070D1F" };
  function read() {
    try { var v = JSON.parse(localStorage.getItem("jk_theme")); if (v === "light" || v === "dark") return v; } catch (e) {}
    return "auto";
  }
  function isDark(t) { return t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); }
  function paint(t) {
    var r = document.documentElement;
    if (t === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = isDark(t) ? COLORS.dark : COLORS.light;
  }
  window.JKTheme = {
    get: read,
    set: function (t) {
      if (t !== "light" && t !== "dark") t = "auto";
      try { localStorage.setItem("jk_theme", JSON.stringify(t)); } catch (e) {}
      paint(t);
    },
    paint: function () { paint(read()); }
  };
  paint(read());
  /* a non-English visitor waits (hidden, max 1.2 s by CSS) for the texts instead of seeing English flash by */
  try {
    var l = JSON.parse(localStorage.getItem("jk_lang")) || (navigator.language || "en").slice(0, 2).toLowerCase();
    if (/^(nl|de|fr|es|zh|ja|ko|ar)$/.test(l)) document.documentElement.classList.add("wait");
  } catch (e) {}
  if (window.matchMedia) {
    var q = matchMedia("(prefers-color-scheme: dark)"), f = function () { if (read() === "auto") paint("auto"); };
    if (q.addEventListener) q.addEventListener("change", f);
  }
})();
