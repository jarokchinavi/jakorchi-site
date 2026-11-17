/* Slide-up sheets (menu, filters, save, navigate, review, report) + pop-up windows + the place card: swipe down to close.
   JK.sheet.open(id) · JK.sheet.close(). One at a time, one history step (phone back closes it), slides in 200 ms.
   Swipe area: the handle (wide, tall) AND the whole top strip (64 px) of every sheet / pop-up / card, as long as the content is scrolled to the top. */
(function () {
  var cur = null, drag = null, ZONE = 64;
  function open(id) {
    var el = typeof id === "string" ? document.getElementById(id) : id;
    if (!el) return;
    if (cur && cur !== el) hide(cur, true);
    cur = el; el.hidden = false;
    void el.offsetWidth; el.classList.add("open");
    try { history.pushState({ jk: "x" }, ""); } catch (e) {}
  }
  function hide(el, quick) {
    el.classList.remove("open"); el.querySelector(".sheet").style.transform = "";
    var done = function () { if (!el.classList.contains("open")) el.hidden = true; };
    if (quick) done(); else setTimeout(done, 220);
    if (cur === el) cur = null;
  }
  function close() { if (!cur) return; if (history.state && history.state.jk === "x") history.back(); else hide(cur); }
  window.addEventListener("popstate", function () { if (cur && !(history.state && history.state.jk === "x")) hide(cur); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && cur && !JK.ui.isOpen()) close(); });
  document.addEventListener("click", function (e) {
    if (cur && e.target.closest(".veil") && cur.contains(e.target)) close();
    if (e.target.closest("[data-sheet-close]")) close();
  });
  /* swipe down on a sheet or a pop-up (the place card has its own up / down handling in peek.js) */
  document.addEventListener("touchstart", function (e) {
    drag = null; if (e.touches.length !== 1) return;
    var p = e.target.closest(".sheet, .box"); if (!p || p.classList.contains("peek")) return;
    if (p.classList.contains("sheet") && !cur) return;
    var r = p.getBoundingClientRect(), y = e.touches[0].clientY;
    if (!(e.target.closest(".handle") || (y - r.top <= ZONE && p.scrollTop <= 0))) return;
    drag = { y: y, s: p, on: false, box: p.classList.contains("box"), v: 0, ly: y, lt: Date.now() };
  }, { passive: true });
  /* it follows your finger 1:1 (a transform only); let go: a pull of 90 px or a quick flick closes it, otherwise it springs back */
  document.addEventListener("touchmove", function (e) {
    if (!drag) return; var t = e.touches[0], d = t.clientY - drag.y, now = Date.now();
    if (!drag.on) { if (d < 8) { if (d < -8) drag = null; return; } drag.on = true; drag.s.style.transition = "none"; drag.s.style.willChange = "transform"; }
    if (e.cancelable) e.preventDefault();
    drag.s.style.transform = "translateY(" + Math.max(0, d) + "px)";
    if (now - drag.lt >= 16) { drag.v = (t.clientY - drag.ly) / (now - drag.lt); drag.ly = t.clientY; drag.lt = now; }
  }, { passive: false });
  document.addEventListener("touchend", function (e) {
    if (!drag) return; var d = e.changedTouches[0].clientY - drag.y, s = drag, on = drag.on; drag = null;
    if (!on) return; s.s.style.transition = ""; s.s.style.willChange = "";
    if (d > 90 || (d > 24 && s.v > .6)) { if (s.box) { s.s.style.transform = ""; JK.ui.close(); } else close(); } else s.s.style.transform = "";
  });
  document.addEventListener("touchcancel", function () { if (drag && drag.on) { drag.s.style.transition = ""; drag.s.style.transform = ""; } drag = null; });
  var prev = JK.layerOpen; JK.layerOpen = function () { return prev() || !!cur; };
  JK.sheet = { open: open, close: close, isOpen: function () { return !!cur; } };
})();
