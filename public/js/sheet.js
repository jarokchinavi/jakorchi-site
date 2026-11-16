/* Slide-up sheets (menu, filters, place peek). JK.sheet.open(id) · JK.sheet.close().
   One at a time, one history step (phone back closes it), swipe the handle down to close. Slides in 200 ms. */
(function () {
  var cur = null, drag = null;
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
  /* swipe down on the handle */
  document.addEventListener("touchstart", function (e) {
    var h = e.target.closest(".handle"); if (!h || !cur) return;
    drag = { y: e.touches[0].clientY, s: cur.querySelector(".sheet") }; drag.s.style.transition = "none";
  }, { passive: true });
  document.addEventListener("touchmove", function (e) { if (!drag) return; var d = Math.max(0, e.touches[0].clientY - drag.y); drag.s.style.transform = "translateY(" + d + "px)"; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (!drag) return; var d = (e.changedTouches[0].clientY - drag.y), s = drag.s; drag = null; s.style.transition = "";
    if (d > 90) close(); else s.style.transform = "";
  });
  var prev = JK.layerOpen; JK.layerOpen = function () { return prev() || !!cur; };
  JK.sheet = { open: open, close: close, isOpen: function () { return !!cur; } };
})();
